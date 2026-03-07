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

    /**
     * Register a VC into the on-chain registry.
     * @param vcHash Hash of the VC.
     * @param subject The address of the wallet that this VC belongs to.
     * @param expiresAt A timestamp where the VC will be usable until.
     */
    function registerCredential(
        string memory vcHash,
        address subject,
        uint256 expiresAt
    ) external {
        bytes memory vcHashBytes = bytes(vcHash); // Convert string to bytes for storage
        require(
            credentials[keccak256(vcHashBytes)].issuer == address(0),
            "VC already exists"
        );

        credentials[keccak256(vcHashBytes)] = Credential({
            subject: subject,
            issuer: msg.sender,
            expiresAt: expiresAt,
            isRevoked: false
        });

        emit VCIssued(keccak256(vcHashBytes), subject, msg.sender, expiresAt); // Emit event with hash
    }

    /**
     * Check if vc is valid.
     * @param vcHash Hash of the VC.
     */
    function revokeCredential(string memory vcHash) external {
        Credential storage credential = credentials[keccak256(bytes(vcHash))];

        require(credential.issuer == msg.sender, "Only issuer can revoke");
        require(!credential.isRevoked, "VC already revoked");

        credential.isRevoked = true;

        emit VCRevoked(keccak256(bytes(vcHash)), msg.sender);
    }

    /**
     * Check if vc is valid.
     * @param vcHash Hash of the VC.
     * @param subject The address of the wallet that this VC belongs to.
     */
    function isValid(
        string memory vcHash,
        address subject
    ) external view returns (bool) {
        Credential memory credential = credentials[keccak256(bytes(vcHash))];

        if (credential.subject != subject) return false; // Subject mismatch
        if (credential.issuer == address(0)) return false; // VC does not exist
        if (credential.isRevoked) return false; // VC has been revoked
        if (block.timestamp > credential.expiresAt) return false; // VC has expired

        return true;
    }
}
