# Prescription Hash Registry

`PrescriptionHashRegistry.sol` stores one SHA-256 hash per prescription ID and exposes:

- `storePrescriptionHash(string prescriptionId, bytes32 sha256Hash)`
- `verifyPrescriptionHash(string prescriptionId, bytes32 sha256Hash)`
- `getPrescriptionRecord(string prescriptionId)`

## Example

For prescription ID `RX-20260518-ABC123`, compute the SHA-256 digest off-chain and pass the 32-byte value:

```solidity
storePrescriptionHash(
  "RX-20260518-ABC123",
  0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
);
```

## Polygon testnet

Deploy the contract to Polygon PoS Amoy, the current Polygon PoS testnet, using chain ID `80002`.
