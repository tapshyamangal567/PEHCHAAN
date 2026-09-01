// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PehchaanAuditAnchor
 * @dev Immutable audit and integrity layer for PEHCHAAN Border Security Application.
 * Stores deterministic cryptographic hashes of verification cases on the Polygon network.
 * NEVER stores personally identifiable information (PII) or sensitive document contents on-chain.
 */
contract PehchaanAuditAnchor {
    address public owner;
    mapping(address => bool) public authorizedRelayers;

    struct AnchorRecord {
        bytes32 caseHash;
        bytes32 documentHash;
        bytes32 resultHash;
        uint256 timestamp;
        address submitter;
        uint256 blockNumber;
    }

    // Mapping from caseHash to AnchorRecord
    mapping(bytes32 => AnchorRecord) private _anchors;

    // Events
    event VerificationAnchored(
        bytes32 indexed caseHash,
        bytes32 indexed documentHash,
        bytes32 resultHash,
        uint256 timestamp,
        address indexed submitter
    );

    event RelayerUpdated(address indexed relayer, bool authorized);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "PehchaanAuditAnchor: caller is not the owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedRelayers[msg.sender],
            "PehchaanAuditAnchor: caller is not authorized"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedRelayers[msg.sender] = true;
        emit RelayerUpdated(msg.sender, true);
    }

    /**
     * @notice Sets or revokes authorization for a backend relayer address
     * @param relayer Address of the backend relayer
     * @param authorized True to authorize, false to revoke
     */
    function setRelayer(address relayer, bool authorized) external onlyOwner {
        require(relayer != address(0), "PehchaanAuditAnchor: invalid relayer address");
        authorizedRelayers[relayer] = authorized;
        emit RelayerUpdated(relayer, authorized);
    }

    /**
     * @notice Transfers contract ownership
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "PehchaanAuditAnchor: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice Anchors an immutable verification case proof on-chain
     * @param caseHash SHA-256 hash of the canonical case representation
     * @param documentHash SHA-256 hash of the original document bytes
     * @param resultHash SHA-256 hash of the canonical verification result
     * @param timestamp Epoch timestamp of when verification occurred
     */
    function anchorVerification(
        bytes32 caseHash,
        bytes32 documentHash,
        bytes32 resultHash,
        uint256 timestamp
    ) external onlyAuthorized returns (bool) {
        require(caseHash != bytes32(0), "PehchaanAuditAnchor: caseHash cannot be empty");
        require(documentHash != bytes32(0), "PehchaanAuditAnchor: documentHash cannot be empty");
        require(resultHash != bytes32(0), "PehchaanAuditAnchor: resultHash cannot be empty");

        // Idempotency: If case is already anchored, do not overwrite original anchor timestamp/record
        require(_anchors[caseHash].timestamp == 0, "PehchaanAuditAnchor: case already anchored");

        _anchors[caseHash] = AnchorRecord({
            caseHash: caseHash,
            documentHash: documentHash,
            resultHash: resultHash,
            timestamp: timestamp > 0 ? timestamp : block.timestamp,
            submitter: msg.sender,
            blockNumber: block.number
        });

        emit VerificationAnchored(
            caseHash,
            documentHash,
            resultHash,
            timestamp > 0 ? timestamp : block.timestamp,
            msg.sender
        );

        return true;
    }

    /**
     * @notice Verifies whether a case hash exists on-chain and retrieves its immutable anchor record
     * @param caseHash SHA-256 hash of the canonical case
     * @return isAnchored True if record exists
     * @return documentHash Hash of original document
     * @return resultHash Hash of verification result
     * @return timestamp Recorded verification timestamp
     * @return submitter Address that submitted the anchor
     * @return blockNumber Block number when anchor was mined
     */
    function verifyCase(bytes32 caseHash)
        external
        view
        returns (
            bool isAnchored,
            bytes32 documentHash,
            bytes32 resultHash,
            uint256 timestamp,
            address submitter,
            uint256 blockNumber
        )
    {
        AnchorRecord memory record = _anchors[caseHash];
        if (record.timestamp == 0) {
            return (false, bytes32(0), bytes32(0), 0, address(0), 0);
        }
        return (
            true,
            record.documentHash,
            record.resultHash,
            record.timestamp,
            record.submitter,
            record.blockNumber
        );
    }
}
