// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GovernanceRegistry.sol";
import "./IdentityRegistry.sol";

/**
 * @title BatchRegistry
 * @dev Core asset ledger mapping physical product batches (GS1 GTIN) to current supply chain stage.
 */
contract BatchRegistry {
    GovernanceRegistry public governance;
    IdentityRegistry public identityRegistry;

    enum BatchStage { Minted, Dispatched, InTransit, CustomsCleared, RetailReady, Disputed }

    struct BatchData {
        string gtin;
        string originFacility;
        uint256 quantity;
        string unit;
        address currentCustodian;
        address manufacturer;
        BatchStage stage;
        uint256 mintedTimestamp;
    }

    mapping(uint256 => BatchData) public batches;
    uint256 public nextBatchId = 1;

    event BatchMinted(uint256 indexed batchId, string gtin, address indexed manufacturer);
    event CustodyTransferred(uint256 indexed batchId, address indexed from, address indexed to);
    event StageUpdated(uint256 indexed batchId, BatchStage stage);

    modifier onlyRole(bytes32 role) {
        require(governance.hasRole(role, msg.sender), "Not authorized");
        _;
    }

    modifier onlyCustodian(uint256 batchId) {
        require(batches[batchId].currentCustodian == msg.sender, "Caller is not current custodian");
        _;
    }

    constructor(address _governance, address _identity) {
        governance = GovernanceRegistry(_governance);
        identityRegistry = IdentityRegistry(_identity);
    }

    /**
     * @dev Supplier mints a new batch
     */
    function mintBatch(
        string calldata _gtin,
        string calldata _originFacility,
        uint256 _quantity,
        string calldata _unit
    ) external onlyRole(governance.SUPPLIER_ROLE()) returns (uint256) {
        require(identityRegistry.isVerified(msg.sender), "Manufacturer identity not verified");

        uint256 batchId = nextBatchId++;
        
        batches[batchId] = BatchData({
            gtin: _gtin,
            originFacility: _originFacility,
            quantity: _quantity,
            unit: _unit,
            currentCustodian: msg.sender,
            manufacturer: msg.sender,
            stage: BatchStage.Minted,
            mintedTimestamp: block.timestamp
        });

        emit BatchMinted(batchId, _gtin, msg.sender);
        return batchId;
    }

    /**
     * @dev Transfer physical custody (e.g. Supplier to Transporter, Transporter to Retailer)
     */
    function transferCustody(uint256 batchId, address newCustodian) external onlyCustodian(batchId) {
        require(newCustodian != address(0), "Invalid custodian");
        // Typically, we might require newCustodian to have a verified identity
        require(identityRegistry.isVerified(newCustodian), "New custodian not verified");

        batches[batchId].currentCustodian = newCustodian;
        emit CustodyTransferred(batchId, msg.sender, newCustodian);
    }

    /**
     * @dev Update lifecycle stage
     * Allows Relayer (SYSTEM_ROLE) or Governance to update states based on IoT triggers
     */
    function updateStage(uint256 batchId, BatchStage _newStage) external {
        require(
            governance.hasRole(governance.SYSTEM_ROLE(), msg.sender) || 
            governance.hasRole(governance.DEFAULT_ADMIN_ROLE(), msg.sender) ||
            msg.sender == batches[batchId].currentCustodian,
            "Not authorized to update stage"
        );

        batches[batchId].stage = _newStage;
        emit StageUpdated(batchId, _newStage);
    }

    function getBatch(uint256 batchId) external view returns (BatchData memory) {
        require(batchId > 0 && batchId < nextBatchId, "Batch does not exist");
        return batches[batchId];
    }
}
