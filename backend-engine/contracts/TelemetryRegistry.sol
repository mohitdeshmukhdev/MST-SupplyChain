// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GovernanceRegistry.sol";
import "./BatchRegistry.sol";

/**
 * @title TelemetryRegistry
 * @dev Anchors keccak256 hashes of high-frequency IoT GPS/Temperature data.
 * The actual raw massive data stays off-chain in Supabase.
 */
contract TelemetryRegistry {
    GovernanceRegistry public governance;
    BatchRegistry public batchRegistry;

    struct TelemetryAnchor {
        bytes32 dataHash;
        uint256 timestamp;
        address submitter;
        bool complianceBreach; // e.g. Temp > 8C flag stored on chain for immediate triggers
    }

    // batchId => Array of hashed telemetry records
    mapping(uint256 => TelemetryAnchor[]) public batchTelemetry;

    event TelemetryAnchored(uint256 indexed batchId, bytes32 indexed dataHash, bool complianceBreach);
    event ComplianceBreached(uint256 indexed batchId, string reason);

    modifier onlyAuthorized(uint256 batchId) {
        BatchRegistry.BatchData memory batch = batchRegistry.getBatch(batchId);
        
        require(
            msg.sender == batch.currentCustodian || 
            governance.hasRole(governance.SYSTEM_ROLE(), msg.sender),
            "Not authorized to submit telemetry"
        );
        _;
    }

    constructor(address _governance, address _batchRegistry) {
        governance = GovernanceRegistry(_governance);
        batchRegistry = BatchRegistry(_batchRegistry);
    }

    /**
     * @dev Anchors a hash representing a snapshot of GPS & Temp data.
     */
    function anchorTelemetry(
        uint256 batchId,
        bytes32 dataHash,
        bool isBreached,
        string calldata breachReason
    ) external onlyAuthorized(batchId) {
        batchTelemetry[batchId].push(TelemetryAnchor({
            dataHash: dataHash,
            timestamp: block.timestamp,
            submitter: msg.sender,
            complianceBreach: isBreached
        }));

        emit TelemetryAnchored(batchId, dataHash, isBreached);

        if (isBreached) {
            emit ComplianceBreached(batchId, breachReason);
            // In a real flow, this might automatically trigger `BatchRegistry.updateStage` to Disputed
        }
    }

    function getTelemetryCount(uint256 batchId) external view returns (uint256) {
        return batchTelemetry[batchId].length;
    }

    function getTelemetryByIndex(uint256 batchId, uint256 index) external view returns (TelemetryAnchor memory) {
        return batchTelemetry[batchId][index];
    }
}
