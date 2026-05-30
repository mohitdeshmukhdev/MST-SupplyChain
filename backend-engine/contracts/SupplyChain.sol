// Location: backend-engine/contracts/SupplyChain.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Enterprise L1 Supply Chain & Escrow Router
 * @notice Handles zero-compromise asset provenance anchoring and escrow payments on the MST Blockchain network.
 */
contract SupplyChain is AccessControl {
    bytes32 public constant SUPPLIER_ROLE = keccak256("SUPPLIER_ROLE");
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant LOGISTICS_ROLE = keccak256("LOGISTICS_ROLE");
    bytes32 public constant CUSTOMS_AGENT_ROLE = keccak256("CUSTOMS_AGENT_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");

    enum Stage { Supplied, Manufactured, InTransit, CustomsCleared, RetailReady, Sold }
    enum EscrowStatus { None, Held, Released, Refunded }

    struct Escrow {
        uint256 amount;
        address payable buyer;
        address payable beneficiary;
        EscrowStatus status;
    }

    struct CustomsDoc {
        string docType;
        string ipfsCid;
        uint256 uploadTime;
        address verifiedBy;
    }

    struct Checkpoint {
        uint256 timestamp;
        string location;
        string status;
        bytes32 dataHash; 
        address handler;
    }

    struct Batch {
        uint256 batchId;
        string productName;
        uint256 quantity;
        string unit;
        uint256 productionDate;
        uint256 expiryDate;
        string internalBatchNo;
        string gs1Gtin;
        string originCountry;
        string handlingInstructions;
        address currentOwner;
        Stage stage;
        bool isCompleted;
        Checkpoint[] journey;
        CustomsDoc[] documentation;
    }

    uint256 private _batchIdCounter;
    mapping(uint256 => Batch) private batches;
    mapping(uint256 => Escrow) private escrows;

    event BatchCreated(uint256 indexed batchId, string productName, address indexed creator);
    event StageChanged(uint256 indexed batchId, Stage indexed stage, bytes32 dataHash, address indexed handler);
    event CustodyTransferred(uint256 indexed batchId, string location, string status, bytes32 dataHash, address indexed handler);
    event CustomsDocumentAttached(uint256 indexed batchId, string docType, string ipfsCid, address indexed authority);
    
    event EscrowDeposited(uint256 indexed batchId, uint256 amount, address indexed buyer, address indexed beneficiary);
    event EscrowReleased(uint256 indexed batchId, uint256 amount, address indexed beneficiary);
    event EscrowRefunded(uint256 indexed batchId, uint256 amount, address indexed buyer);

    constructor(address rootAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, rootAdmin);
        _grantRole(SUPPLIER_ROLE, rootAdmin);
        _grantRole(MANUFACTURER_ROLE, rootAdmin);
        _grantRole(LOGISTICS_ROLE, rootAdmin);
        _grantRole(CUSTOMS_AGENT_ROLE, rootAdmin);
        _grantRole(RETAILER_ROLE, rootAdmin);
    }

    function createBatch(
        string calldata productName, 
        uint256 quantity,
        string calldata unit,
        uint256 productionDate,
        uint256 expiryDate,
        string calldata internalBatchNo,
        string calldata gs1Gtin,
        string calldata originCountry,
        string calldata handlingInstructions,
        string calldata initialLocation, 
        bytes32 erpHash
    ) 
        external 
        onlyRole(SUPPLIER_ROLE) 
        returns (uint256) 
    {
        _batchIdCounter++;
        uint256 newBatchId = _batchIdCounter;

        Batch storage newBatch = batches[newBatchId];
        newBatch.batchId = newBatchId;
        newBatch.productName = productName;
        newBatch.quantity = quantity;
        newBatch.unit = unit;
        newBatch.productionDate = productionDate;
        newBatch.expiryDate = expiryDate;
        newBatch.internalBatchNo = internalBatchNo;
        newBatch.gs1Gtin = gs1Gtin;
        newBatch.originCountry = originCountry;
        newBatch.handlingInstructions = handlingInstructions;
        newBatch.currentOwner = msg.sender;
        newBatch.stage = Stage.Supplied;
        newBatch.isCompleted = false;

        newBatch.journey.push(Checkpoint({
            timestamp: block.timestamp,
            location: initialLocation,
            status: "Batch Origin Created",
            dataHash: erpHash,
            handler: msg.sender
        }));

        emit BatchCreated(newBatchId, productName, msg.sender);
        emit StageChanged(newBatchId, Stage.Supplied, erpHash, msg.sender);
        return newBatchId;
    }

    function processManufacturing(uint256 batchId, bytes32 erpHash) 
        external 
        onlyRole(MANUFACTURER_ROLE) 
    {
        Batch storage targetBatch = batches[batchId];
        require(targetBatch.batchId != 0, "SC_ERR: Batch target index does not exist.");
        require(targetBatch.stage == Stage.Supplied, "SC_ERR: Invalid stage sequence.");

        targetBatch.stage = Stage.Manufactured;
        targetBatch.currentOwner = msg.sender;
        targetBatch.journey.push(Checkpoint({
            timestamp: block.timestamp,
            location: "Factory Processing",
            status: "Manufacture Processing Completed",
            dataHash: erpHash,
            handler: msg.sender
        }));

        emit StageChanged(batchId, Stage.Manufactured, erpHash, msg.sender);
    }

    function startTransit(uint256 batchId, bytes32 erpHash) 
        external 
        onlyRole(LOGISTICS_ROLE) 
    {
        Batch storage targetBatch = batches[batchId];
        require(targetBatch.batchId != 0, "SC_ERR: Batch target index does not exist.");
        require(targetBatch.stage == Stage.Manufactured, "SC_ERR: Invalid stage sequence.");

        targetBatch.stage = Stage.InTransit;
        targetBatch.currentOwner = msg.sender;
        targetBatch.journey.push(Checkpoint({
            timestamp: block.timestamp,
            location: "Logistics Hub",
            status: "In Transit Started",
            dataHash: erpHash,
            handler: msg.sender
        }));

        emit StageChanged(batchId, Stage.InTransit, erpHash, msg.sender);
    }

    function transferCustody(uint256 batchId, string calldata nextLocation, string calldata currentStatus, bytes32 erpHash) 
        external 
        onlyRole(LOGISTICS_ROLE) 
    {
        Batch storage targetBatch = batches[batchId];
        require(targetBatch.batchId != 0, "SC_ERR: Batch target index does not exist.");
        require(targetBatch.stage == Stage.InTransit, "SC_ERR: Batch is not currently in transit.");

        targetBatch.currentOwner = msg.sender;
        targetBatch.journey.push(Checkpoint({
            timestamp: block.timestamp,
            location: nextLocation,
            status: currentStatus,
            dataHash: erpHash,
            handler: msg.sender
        }));

        emit CustodyTransferred(batchId, nextLocation, currentStatus, erpHash, msg.sender);
    }

    function attachCustomsDocument(uint256 batchId, string calldata docType, string calldata ipfsCid) 
        external 
        onlyRole(CUSTOMS_AGENT_ROLE) 
    {
        Batch storage targetBatch = batches[batchId];
        require(targetBatch.batchId != 0, "SC_ERR: Batch target index does not exist.");
        require(targetBatch.stage == Stage.InTransit, "SC_ERR: Invalid stage sequence.");
        require(bytes(ipfsCid).length == 46, "SC_ERR: Invalid cryptographic IPFS CID signature length.");
        
        targetBatch.documentation.push(CustomsDoc({
            docType: docType,
            ipfsCid: ipfsCid,
            uploadTime: block.timestamp,
            verifiedBy: msg.sender
        }));

        targetBatch.stage = Stage.CustomsCleared;
        
        // Auto-compute hash for state transition event
        bytes32 dataHash = keccak256(abi.encodePacked(docType, ipfsCid));
        targetBatch.journey.push(Checkpoint({
            timestamp: block.timestamp,
            location: "Border Customs Checkpoint",
            status: "Customs Compliance Docs Verified",
            dataHash: dataHash,
            handler: msg.sender
        }));

        emit CustomsDocumentAttached(batchId, docType, ipfsCid, msg.sender);
        emit StageChanged(batchId, Stage.CustomsCleared, dataHash, msg.sender);
    }

    function receiveAtRetail(uint256 batchId, bytes32 erpHash) 
        external 
        onlyRole(RETAILER_ROLE) 
    {
        Batch storage targetBatch = batches[batchId];
        require(targetBatch.batchId != 0, "SC_ERR: Batch target index does not exist.");
        require(targetBatch.stage == Stage.CustomsCleared, "SC_ERR: Invalid stage sequence.");

        targetBatch.stage = Stage.RetailReady;
        targetBatch.currentOwner = msg.sender;
        targetBatch.journey.push(Checkpoint({
            timestamp: block.timestamp,
            location: "Retail Store",
            status: "Received and Stocked at Retail Outlet",
            dataHash: erpHash,
            handler: msg.sender
        }));

        emit StageChanged(batchId, Stage.RetailReady, erpHash, msg.sender);

        // Auto-release escrow when goods reach retail store
        _releaseEscrow(batchId);
    }

    function sellToConsumer(uint256 batchId, bytes32 erpHash) 
        external 
        onlyRole(RETAILER_ROLE) 
    {
        Batch storage targetBatch = batches[batchId];
        require(targetBatch.batchId != 0, "SC_ERR: Batch target index does not exist.");
        require(targetBatch.stage == Stage.RetailReady, "SC_ERR: Batch not ready for final sale.");

        targetBatch.stage = Stage.Sold;
        targetBatch.isCompleted = true;
        targetBatch.journey.push(Checkpoint({
            timestamp: block.timestamp,
            location: "Point of Sale",
            status: "Sold to End Consumer",
            dataHash: erpHash,
            handler: msg.sender
        }));

        emit StageChanged(batchId, Stage.Sold, erpHash, msg.sender);
    }

    // --- Escrow Functions ---

    function depositEscrow(uint256 batchId, address payable beneficiary) external payable {
        require(msg.value > 0, "SC_ERR: Zero deposit value.");
        require(batches[batchId].batchId != 0, "SC_ERR: Batch target index does not exist.");
        require(escrows[batchId].status == EscrowStatus.None, "SC_ERR: Escrow already active or closed.");

        escrows[batchId] = Escrow({
            amount: msg.value,
            buyer: payable(msg.sender),
            beneficiary: beneficiary,
            status: EscrowStatus.Held
        });

        emit EscrowDeposited(batchId, msg.value, msg.sender, beneficiary);
    }

    function _releaseEscrow(uint256 batchId) internal {
        Escrow storage escrow = escrows[batchId];
        if (escrow.status == EscrowStatus.Held) {
            escrow.status = EscrowStatus.Released;
            uint256 transferAmount = escrow.amount;
            escrow.amount = 0;
            
            (bool success, ) = escrow.beneficiary.call{value: transferAmount}("");
            require(success, "SC_ERR: Escrow release transfer failed.");

            emit EscrowReleased(batchId, transferAmount, escrow.beneficiary);
        }
    }

    function refundEscrow(uint256 batchId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Escrow storage escrow = escrows[batchId];
        require(escrow.status == EscrowStatus.Held, "SC_ERR: Escrow is not in Held state.");
        
        escrow.status = EscrowStatus.Refunded;
        uint256 refundAmount = escrow.amount;
        address payable buyer = escrow.buyer;
        escrow.amount = 0;
        
        (bool success, ) = buyer.call{value: refundAmount}("");
        require(success, "SC_ERR: Escrow refund transfer failed.");

        emit EscrowRefunded(batchId, refundAmount, buyer);
    }

    // --- Getters ---

    function getBatchHistory(uint256 batchId) external view returns (Batch memory) {
        require(batches[batchId].batchId != 0, "SC_ERR: Batch target index does not exist.");
        return batches[batchId];
    }

    function getEscrowDetails(uint256 batchId) external view returns (uint256, address, address, EscrowStatus) {
        Escrow memory escrow = escrows[batchId];
        return (escrow.amount, escrow.buyer, escrow.beneficiary, escrow.status);
    }
}
