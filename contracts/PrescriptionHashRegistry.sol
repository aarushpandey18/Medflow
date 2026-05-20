// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PrescriptionHashRegistry {
    struct PrescriptionRecord {
        bytes32 sha256Hash;
        uint256 storedAt;
        address storedBy;
    }

    mapping(string prescriptionId => PrescriptionRecord) private prescriptions;

    event PrescriptionHashStored(
        string indexed prescriptionId,
        bytes32 sha256Hash,
        address indexed storedBy,
        uint256 storedAt
    );

    error EmptyPrescriptionId();
    error EmptyHash();
    error PrescriptionAlreadyExists(string prescriptionId);

    function storePrescriptionHash(
        string calldata prescriptionId,
        bytes32 sha256Hash
    ) external {
        if (bytes(prescriptionId).length == 0) {
            revert EmptyPrescriptionId();
        }

        if (sha256Hash == bytes32(0)) {
            revert EmptyHash();
        }

        if (prescriptions[prescriptionId].storedAt != 0) {
            revert PrescriptionAlreadyExists(prescriptionId);
        }

        prescriptions[prescriptionId] = PrescriptionRecord({
            sha256Hash: sha256Hash,
            storedAt: block.timestamp,
            storedBy: msg.sender
        });

        emit PrescriptionHashStored(
            prescriptionId,
            sha256Hash,
            msg.sender,
            block.timestamp
        );
    }

    function verifyPrescriptionHash(
        string calldata prescriptionId,
        bytes32 sha256Hash
    ) external view returns (bool) {
        return prescriptions[prescriptionId].sha256Hash == sha256Hash;
    }

    function getPrescriptionRecord(
        string calldata prescriptionId
    )
        external
        view
        returns (bytes32 sha256Hash, uint256 storedAt, address storedBy)
    {
        PrescriptionRecord memory record = prescriptions[prescriptionId];
        return (record.sha256Hash, record.storedAt, record.storedBy);
    }
}
