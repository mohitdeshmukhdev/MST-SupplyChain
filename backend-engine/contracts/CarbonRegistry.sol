// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GovernanceRegistry.sol";
import "./BatchRegistry.sol";

/**
 * @title CarbonRegistry
 * @dev Tracks and logs the tokenized carbon footprint of a specific supply chain batch.
 */
contract CarbonRegistry {
    GovernanceRegistry public governance;
    BatchRegistry public batchRegistry;

    struct CarbonLog {
        uint256 distanceKm;
        uint256 emissionsKg; // kg of CO2
        string vehicleType;
        address transporter;
        uint256 timestamp;
    }

    // batchId => Array of carbon logs per leg of the journey
    mapping(uint256 => CarbonLog[]) public carbonLogs;
    
    // batchId => Total emissions in kg
    mapping(uint256 => uint256) public totalCarbonEmissions;

    event CarbonLogged(uint256 indexed batchId, uint256 emissionsKg, address indexed transporter);

    modifier onlyAuthorized(uint256 batchId) {
        BatchRegistry.BatchData memory batch = batchRegistry.getBatch(batchId);
        require(
            msg.sender == batch.currentCustodian ||
            governance.hasRole(governance.SYSTEM_ROLE(), msg.sender),
            "Not authorized to log carbon"
        );
        _;
    }

    constructor(address _governance, address _batchRegistry) {
        governance = GovernanceRegistry(_governance);
        batchRegistry = BatchRegistry(_batchRegistry);
    }

    /**
     * @dev Transporter or backend relayer logs carbon emissions for a transit leg
     */
    function logEmissions(
        uint256 batchId,
        uint256 distanceKm,
        uint256 emissionsKg,
        string calldata vehicleType
    ) external onlyAuthorized(batchId) {
        require(emissionsKg > 0, "Emissions must be > 0");
        
        carbonLogs[batchId].push(CarbonLog({
            distanceKm: distanceKm,
            emissionsKg: emissionsKg,
            vehicleType: vehicleType,
            transporter: msg.sender,
            timestamp: block.timestamp
        }));

        totalCarbonEmissions[batchId] += emissionsKg;

        emit CarbonLogged(batchId, emissionsKg, msg.sender);
    }

    function getCarbonLogsCount(uint256 batchId) external view returns (uint256) {
        return carbonLogs[batchId].length;
    }

    function getCarbonLogByIndex(uint256 batchId, uint256 index) external view returns (CarbonLog memory) {
        return carbonLogs[batchId][index];
    }
}
