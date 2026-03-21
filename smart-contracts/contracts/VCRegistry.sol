// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract VCRegistry is Ownable, Pausable {
    struct Credential {
        address subject;
        address issuer;
        uint256 expiresAt;
        bool isRevoked;
    }

    mapping(bytes32 => Credential) public credentials;
    mapping(address => bool) public authorisedIssuers;

    event VCIssued(
        bytes32 indexed vcHash,
        address indexed subject,
        address indexed issuer,
        uint256 expiresAt
    );

    event VCRevoked(bytes32 indexed vcHash, address indexed issuer);
    event IssuerAuthorisationUpdated(address indexed issuer, bool isAuthorised);

    constructor() Ownable(msg.sender) {
        authorisedIssuers[msg.sender] = true;
        emit IssuerAuthorisationUpdated(msg.sender, true);
    }

    modifier onlyAuthorisedIssuer() {
        require(authorisedIssuers[msg.sender], "Unauthorised issuer");
        _;
    }

    function setAuthorisedIssuer(
        address issuer,
        bool isAuthorised
    ) external onlyOwner {
        require(issuer != address(0), "Invalid issuer");
        authorisedIssuers[issuer] = isAuthorised;
        emit IssuerAuthorisationUpdated(issuer, isAuthorised);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * Register a VC into the on-chain registry.
     * @param vcHash keccak256 hash of the off-chain VC payload.
     * @param subject The address of the wallet that this VC belongs to.
     * @param expiresAt A timestamp where the VC will be usable until.
     */
    function registerCredential(
        bytes32 vcHash,
        address subject,
        uint256 expiresAt
    ) external whenNotPaused onlyAuthorisedIssuer {
        require(vcHash != bytes32(0), "Empty VC hash");
        require(subject != address(0), "Invalid subject");
        require(expiresAt > block.timestamp, "Invalid expiry");
        require(
            credentials[vcHash].issuer == address(0),
            "VC already exists"
        );

        credentials[vcHash] = Credential({
            subject: subject,
            issuer: msg.sender,
            expiresAt: expiresAt,
            isRevoked: false
        });

        emit VCIssued(vcHash, subject, msg.sender, expiresAt);
    }

    /**
     * Revoke a VC that was previously issued.
     * @param vcHash keccak256 hash of the off-chain VC payload.
     */
    function revokeCredential(bytes32 vcHash) external whenNotPaused {
        require(vcHash != bytes32(0), "Empty VC hash");
        Credential storage credential = credentials[vcHash];

        require(credential.issuer != address(0), "VC does not exist");
        require(credential.issuer == msg.sender, "Only issuer can revoke");
        require(authorisedIssuers[msg.sender], "Unauthorised issuer");
        require(!credential.isRevoked, "VC already revoked");

        credential.isRevoked = true;

        emit VCRevoked(vcHash, msg.sender);
    }

    /**
     * Check if VC is valid for a holder subject.
     * @param vcHash keccak256 hash of the off-chain VC payload.
     * @param subject The address of the wallet that this VC belongs to.
     */
    function isValid(
        bytes32 vcHash,
        address subject
    ) external view returns (bool) {
        if (vcHash == bytes32(0)) return false;
        Credential memory credential = credentials[vcHash];

        if (credential.subject != subject) return false;
        if (credential.issuer == address(0)) return false;
        if (credential.isRevoked) return false;
        if (block.timestamp > credential.expiresAt) return false;

        return true;
    }

    /**
     * Return VC metadata for verifiers/indexers.
     * @param vcHash keccak256 hash of the off-chain VC payload.
     */
    function getCredential(
        bytes32 vcHash
    ) external view returns (Credential memory) {
        return credentials[vcHash];
    }
}
