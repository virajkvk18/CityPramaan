// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CityPramaanRegistry {
    enum Status {
        ReportCreated,
        RepairSubmitted,
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

    mapping(string => ProofRecord) public proofs;

    event ReportCreated(string indexed publicId, bytes32 reportHash, address indexed actor);
    event RepairSubmitted(string indexed publicId, bytes32 repairHash, address indexed actor);
    event StatusUpdated(string indexed publicId, Status status, address indexed actor);

    function createReport(string calldata publicId, bytes32 reportHash) external {
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

    function submitRepair(string calldata publicId, bytes32 repairHash) external {
        require(proofs[publicId].updatedAt != 0, "missing report");

        proofs[publicId].repairHash = repairHash;
        proofs[publicId].status = Status.RepairSubmitted;
        proofs[publicId].actor = msg.sender;
        proofs[publicId].updatedAt = block.timestamp;

        emit RepairSubmitted(publicId, repairHash, msg.sender);
    }

    function updateStatus(string calldata publicId, Status status) external {
        require(proofs[publicId].updatedAt != 0, "missing report");

        proofs[publicId].status = status;
        proofs[publicId].actor = msg.sender;
        proofs[publicId].updatedAt = block.timestamp;

        emit StatusUpdated(publicId, status, msg.sender);
    }
}
