// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title GovernanceRegistry
 * @dev Centralized Role-Based Access Control (RBAC) for the entire MST SaralChain ecosystem.
 * Acts as the absolute root of trust. Other registries will query this contract.
 */
contract GovernanceRegistry is AccessControl {
    bytes32 public constant SUPPLIER_ROLE = keccak256("SUPPLIER_ROLE");
    bytes32 public constant LOGISTICS_ROLE = keccak256("LOGISTICS_ROLE");
    bytes32 public constant CUSTOMS_ROLE = keccak256("CUSTOMS_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant SYSTEM_ROLE = keccak256("SYSTEM_ROLE"); // For backend relayer APIs

    event RoleGrantedEvent(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevokedEvent(bytes32 indexed role, address indexed account, address indexed sender);

    constructor() {
        // Grant the deployer the default admin role: it will be able to grant and revoke any roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Overrides grantRole to emit custom events for external indexing if needed
     */
    function grantRole(bytes32 role, address account) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        super.grantRole(role, account);
        emit RoleGrantedEvent(role, account, msg.sender);
    }

    /**
     * @dev Overrides revokeRole to emit custom events for external indexing if needed
     */
    function revokeRole(bytes32 role, address account) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        super.revokeRole(role, account);
        emit RoleRevokedEvent(role, account, msg.sender);
    }

    /**
     * @dev Utility to check if an address has a specific role (returns boolean instead of reverting)
     */
    function checkRole(bytes32 role, address account) external view returns (bool) {
        return hasRole(role, account);
    }
}
