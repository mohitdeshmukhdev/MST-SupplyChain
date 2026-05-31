// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GovernanceRegistry.sol";
import "./BatchRegistry.sol";

/**
 * @title EscrowRegistry
 * @dev Holds tMST funds deposited by buyers (retailers) and releases them securely to sellers (suppliers).
 */
contract EscrowRegistry {
    GovernanceRegistry public governance;
    BatchRegistry public batchRegistry;

    struct EscrowAgreement {
        uint256 amount;
        address buyer;
        address seller;
        bool isFunded;
        bool isReleased;
        bool isDisputed;
    }

    // batchId => EscrowAgreement
    mapping(uint256 => EscrowAgreement) public escrows;

    event EscrowFunded(uint256 indexed batchId, address indexed buyer, uint256 amount);
    event FundsReleased(uint256 indexed batchId, address indexed seller, uint256 amount);
    event EscrowDisputed(uint256 indexed batchId);
    event FundsRefunded(uint256 indexed batchId, address indexed buyer, uint256 amount);

    modifier onlyBuyer(uint256 batchId) {
        require(msg.sender == escrows[batchId].buyer, "Not authorized: Buyer only");
        _;
    }

    modifier onlyAdmin() {
        require(governance.hasRole(governance.DEFAULT_ADMIN_ROLE(), msg.sender), "Not authorized: Admin only");
        _;
    }

    constructor(address _governance, address _batchRegistry) {
        governance = GovernanceRegistry(_governance);
        batchRegistry = BatchRegistry(_batchRegistry);
    }

    /**
     * @dev Retailer deposits native tMST (msg.value) to secure a batch order
     */
    function fundEscrow(uint256 batchId, address _seller) external payable {
        require(msg.value > 0, "Deposit must be > 0");
        require(!escrows[batchId].isFunded, "Escrow already funded");

        // The batch must exist in BatchRegistry
        BatchRegistry.BatchData memory batch = batchRegistry.getBatch(batchId);
        require(batch.manufacturer != address(0), "Batch does not exist");

        escrows[batchId] = EscrowAgreement({
            amount: msg.value,
            buyer: msg.sender,
            seller: _seller,
            isFunded: true,
            isReleased: false,
            isDisputed: false
        });

        emit EscrowFunded(batchId, msg.sender, msg.value);
    }

    /**
     * @dev Release funds to seller. Anyone can call this IF the batch stage is RetailReady.
     * Prevents reentrancy by updating state before external call.
     */
    function releaseFunds(uint256 batchId) external {
        EscrowAgreement storage escrow = escrows[batchId];
        require(escrow.isFunded, "Not funded");
        require(!escrow.isReleased, "Already released");
        require(!escrow.isDisputed, "Escrow is disputed");

        // Verify the physical batch has reached RetailReady status
        BatchRegistry.BatchData memory batch = batchRegistry.getBatch(batchId);
        require(
            batch.stage == BatchRegistry.BatchStage.RetailReady, 
            "Batch is not RetailReady"
        );

        // CEI pattern
        escrow.isReleased = true;
        uint256 amountToTransfer = escrow.amount;

        (bool success, ) = escrow.seller.call{value: amountToTransfer}("");
        require(success, "Transfer to seller failed");

        emit FundsReleased(batchId, escrow.seller, amountToTransfer);
    }

    /**
     * @dev Admin can flag an escrow as disputed (e.g. counterfeit detected)
     */
    function markDisputed(uint256 batchId) external onlyAdmin {
        require(escrows[batchId].isFunded, "Not funded");
        require(!escrows[batchId].isReleased, "Already released");
        
        escrows[batchId].isDisputed = true;
        emit EscrowDisputed(batchId);
    }

    /**
     * @dev Admin can refund buyer if dispute resolves in buyer's favor
     */
    function refundBuyer(uint256 batchId) external onlyAdmin {
        EscrowAgreement storage escrow = escrows[batchId];
        require(escrow.isDisputed, "Must be in dispute");
        require(!escrow.isReleased, "Already released");

        // CEI pattern
        escrow.isReleased = true; // prevent double spend
        uint256 amountToRefund = escrow.amount;

        (bool success, ) = escrow.buyer.call{value: amountToRefund}("");
        require(success, "Refund to buyer failed");

        emit FundsRefunded(batchId, escrow.buyer, amountToRefund);
    }
}
