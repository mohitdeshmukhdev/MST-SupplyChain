// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GovernanceRegistry.sol";
import "./BatchRegistry.sol";

/**
 * @title DocumentRegistry
 * @dev Links batch IDs to IPFS CIDs for compliance, phytosanitary, and customs documents.
 */
contract DocumentRegistry {
    GovernanceRegistry public governance;
    BatchRegistry public batchRegistry;

    struct DocumentData {
        string ipfsCid;
        string documentType; // e.g. "Bill_Of_Lading", "Phytosanitary_Cert"
        uint256 uploadedTimestamp;
        address uploader;
    }

    // batchId => Array of documents attached
    mapping(uint256 => DocumentData[]) public batchDocuments;

    event DocumentAttached(uint256 indexed batchId, string ipfsCid, string documentType, address indexed uploader);

    modifier onlyAuthorized(uint256 batchId) {
        BatchRegistry.BatchData memory batch = batchRegistry.getBatch(batchId);
        require(
            msg.sender == batch.currentCustodian ||
            governance.hasRole(governance.CUSTOMS_ROLE(), msg.sender) ||
            governance.hasRole(governance.SYSTEM_ROLE(), msg.sender),
            "Not authorized to attach document"
        );
        _;
    }

    constructor(address _governance, address _batchRegistry) {
        governance = GovernanceRegistry(_governance);
        batchRegistry = BatchRegistry(_batchRegistry);
    }

    /**
     * @dev Attach a new IPFS CID to a batch.
     */
    function attachDocument(
        uint256 batchId,
        string calldata ipfsCid,
        string calldata documentType
    ) external onlyAuthorized(batchId) {
        require(bytes(ipfsCid).length > 0, "IPFS CID is required");
        require(bytes(documentType).length > 0, "Document type is required");

        batchDocuments[batchId].push(DocumentData({
            ipfsCid: ipfsCid,
            documentType: documentType,
            uploadedTimestamp: block.timestamp,
            uploader: msg.sender
        }));

        emit DocumentAttached(batchId, ipfsCid, documentType, msg.sender);
    }

    function getDocumentCount(uint256 batchId) external view returns (uint256) {
        return batchDocuments[batchId].length;
    }

    function getDocumentByIndex(uint256 batchId, uint256 index) external view returns (DocumentData memory) {
        return batchDocuments[batchId][index];
    }
}
