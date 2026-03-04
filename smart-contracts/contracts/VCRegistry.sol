// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VCRegistry {
    struct Credential {
        address subject;
        address issuer;
        uint256 expiresAt;
        bool isRevoked;
    }

    mapping(bytes32 => Credential) public credentials; // Mapping of bytes to credentials

    event VCIssued(
        bytes32 indexed vcHash,
        address indexed subject,
        address indexed issuer,
        uint256 expiresAt
    );

    event VCRevoked(bytes32 indexed vcHash, address indexed issuer);

    // todo: external
    /**
     * Register a VC into the on-chain registry.
     * @param vcHash Hash of the VC.
     * @param subject The address of the wallet that this VC belongs to.
     * @param expiresAt A timestamp where the VC will be usable until.
     */
    function registerCredential(
        bytes32 vcHash,
        address subject,
        uint256 expiresAt
    ) external {
        require(credentials[vcHash].issuer == address(0), "VC already exists");

        credentials[vcHash] = Credential({
            subject: subject,
            issuer: msg.sender,
            expiresAt: expiresAt,
            isRevoked: false
        });

        emit VCIssued(vcHash, subject, msg.sender, expiresAt);
    }

    // todo: storage
    /**
     * Check if vc is valid.
     * @param vcHash Hash of the VC.
     */
    function revokeCredential(bytes32 vcHash) external {
        Credential storage credential = credentials[vcHash];

        require(credential.issuer == msg.sender, "Only issuer can revoke");
        require(!credential.isRevoked, "VC already revoked");

        credential.isRevoked = true;

        emit VCRevoked(vcHash, msg.sender);
    }

    /**
     * Check if vc is valid.
     * @param vcHash Hash of the VC.
     * @param subject The address of the wallet that this VC belongs to.
     */
    function isValid(
        bytes32 vcHash,
        address subject
    ) external view returns (bool) {
        Credential memory credential = credentials[vcHash];

        if (credential.subject != subject) return false; // Subject mismatch
        if (credential.issuer == address(0)) return false; // VC does not exist
        if (credential.isRevoked) return false; // VC has been revoked
        if (block.timestamp > credential.expiresAt) return false; // VC has expired

        return true;
    }
}
