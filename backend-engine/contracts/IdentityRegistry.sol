// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GovernanceRegistry.sol";

/**
 * @title IdentityRegistry
 * @dev Manages KYC/KYB verified corporate identities mapped to wallet addresses.
 */
contract IdentityRegistry {
    GovernanceRegistry public governance;

    struct CorporateIdentity {
        string businessName;
        string taxId;
        string jurisdiction;
        string primaryRole; // e.g. "Supplier", "Customs", "Retailer"
        bool isVerified;
        uint256 verificationTimestamp;
    }

    mapping(address => CorporateIdentity) private _identities;

    event IdentityVerified(address indexed wallet, string businessName, string primaryRole);
    event IdentityRevoked(address indexed wallet);

    modifier onlyAdmin() {
        require(governance.hasRole(governance.DEFAULT_ADMIN_ROLE(), msg.sender), "Not authorized: Admin only");
        _;
    }

    constructor(address _governanceAddress) {
        require(_governanceAddress != address(0), "Invalid governance address");
        governance = GovernanceRegistry(_governanceAddress);
    }

    /**
     * @dev Add or update a verified corporate identity
     */
    function verifyIdentity(
        address wallet,
        string calldata businessName,
        string calldata taxId,
        string calldata jurisdiction,
        string calldata primaryRole
    ) external onlyAdmin {
        require(wallet != address(0), "Invalid wallet address");
        require(bytes(businessName).length > 0, "Business name required");
        require(bytes(taxId).length > 0, "Tax ID required");

        _identities[wallet] = CorporateIdentity({
            businessName: businessName,
            taxId: taxId,
            jurisdiction: jurisdiction,
            primaryRole: primaryRole,
            isVerified: true,
            verificationTimestamp: block.timestamp
        });

        emit IdentityVerified(wallet, businessName, primaryRole);
    }

    /**
     * @dev Revoke an identity (e.g. fraudulent activity)
     */
    function revokeIdentity(address wallet) external onlyAdmin {
        require(_identities[wallet].isVerified, "Identity not verified");
        _identities[wallet].isVerified = false;
        emit IdentityRevoked(wallet);
    }

    /**
     * @dev Check if a wallet has a verified corporate identity
     */
    function isVerified(address wallet) external view returns (bool) {
        return _identities[wallet].isVerified;
    }

    /**
     * @dev Retrieve identity details
     */
    function getIdentity(address wallet) external view returns (CorporateIdentity memory) {
        require(_identities[wallet].isVerified, "Identity not verified");
        return _identities[wallet];
    }
}
