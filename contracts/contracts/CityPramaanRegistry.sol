// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CityPramaanRegistry {
    enum AccountRole {
        Citizen,
        WardAdmin,
        Contractor
    }

    enum Status {
        ReportCreated,
        RepairSubmitted,
        AdminApproved,
        WarrantyActivated,
        RepeatFailure,
        Closed
    }

    struct ProofRecord {
        bytes32 reportHash;
        bytes32 repairHash;
        Status status;
        address actor;
        uint256 updatedAt;
    }

    struct ProfileRecord {
        bytes32 profileHash;
        AccountRole role;
        bool wardAdminAllowed;
        bool contractorAllowed;
        uint256 updatedAt;
    }

    mapping(string => ProofRecord) public proofs;
    mapping(address => ProfileRecord) public profiles;
    address public owner;
    mapping(address => bool) public wardAdmins;
    mapping(address => bool) public contractors;

    event ReportCreated(string indexed publicId, bytes32 reportHash, address indexed actor);
    event RepairSubmitted(string indexed publicId, bytes32 repairHash, address indexed actor);
    event StatusUpdated(string indexed publicId, Status status, address indexed actor);
    event WardAdminUpdated(address indexed account, bool allowed);
    event ContractorUpdated(address indexed account, bool allowed);
    event ProfileUpdated(address indexed account, bytes32 profileHash, AccountRole role);

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    modifier onlyWardAdmin() {
        require(msg.sender == owner || wardAdmins[msg.sender], "ward admin only");
        _;
    }

    modifier onlyContractor() {
        require(msg.sender == owner || contractors[msg.sender], "contractor only");
        _;
    }

    constructor() {
        owner = msg.sender;
        wardAdmins[msg.sender] = true;
        contractors[msg.sender] = true;
        emit WardAdminUpdated(msg.sender, true);
        emit ContractorUpdated(msg.sender, true);
    }

    function setWardAdmin(address account, bool allowed) external onlyOwner {
        require(account != address(0), "zero address");
        wardAdmins[account] = allowed;
        profiles[account].wardAdminAllowed = allowed;
        profiles[account].updatedAt = block.timestamp;
        emit WardAdminUpdated(account, allowed);
    }

    function setContractor(address account, bool allowed) external onlyOwner {
        require(account != address(0), "zero address");
        contractors[account] = allowed;
        profiles[account].contractorAllowed = allowed;
        profiles[account].updatedAt = block.timestamp;
        emit ContractorUpdated(account, allowed);
    }

    function updateProfile(bytes32 profileHash, AccountRole role) external {
        require(profileHash != bytes32(0), "empty profile hash");

        profiles[msg.sender] = ProfileRecord({
            profileHash: profileHash,
            role: role,
            wardAdminAllowed: wardAdmins[msg.sender] || msg.sender == owner,
            contractorAllowed: contractors[msg.sender] || msg.sender == owner,
            updatedAt: block.timestamp
        });

        emit ProfileUpdated(msg.sender, profileHash, role);
    }

    function createReport(string calldata publicId, bytes32 reportHash) external {
        require(bytes(publicId).length > 0, "empty public id");
        require(reportHash != bytes32(0), "empty report hash");
        require(proofs[publicId].updatedAt == 0, "proof exists");

        proofs[publicId] = ProofRecord({
            reportHash: reportHash,
            repairHash: bytes32(0),
            status: Status.ReportCreated,
            actor: msg.sender,
            updatedAt: block.timestamp
        });

        emit ReportCreated(publicId, reportHash, msg.sender);
    }

    function submitRepair(string calldata publicId, bytes32 repairHash) external onlyContractor {
        require(proofs[publicId].updatedAt != 0, "missing report");
        require(repairHash != bytes32(0), "empty repair hash");

        proofs[publicId].repairHash = repairHash;
        proofs[publicId].status = Status.RepairSubmitted;
        proofs[publicId].actor = msg.sender;
        proofs[publicId].updatedAt = block.timestamp;

        emit RepairSubmitted(publicId, repairHash, msg.sender);
    }

    function updateStatus(string calldata publicId, Status status) external onlyWardAdmin {
        require(proofs[publicId].updatedAt != 0, "missing report");
        require(status != Status.ReportCreated, "invalid status");

        proofs[publicId].status = status;
        proofs[publicId].actor = msg.sender;
        proofs[publicId].updatedAt = block.timestamp;

        emit StatusUpdated(publicId, status, msg.sender);
    }
}
