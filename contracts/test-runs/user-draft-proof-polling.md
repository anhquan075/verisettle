# User Draft Attestation Polling Record

The real buyer source acceptance for user order `2w8_iT1aNogY1b` was mined on Ethereum Sepolia:

- Source transaction: `0x46d774edf8321e68020559751a03929176484749776ca419927277da9736ca7a`
- Explorer: https://sepolia.etherscan.io/tx/0x46d774edf8321e68020559751a03929176484749776ca419927277da9736ca7a
- Source block: `11484760`
- Application state after receipt validation: `proof_pending`

The official Attestcoin CC3 Testnet proof service at `https://prover.cc3-testnet.creditcoin.network/` was polled by the guarded release harness. Early requests returned HTTP `404` while the source receipt was not yet indexed; the thirteenth attempt returned HTTP `422`. No duplicate source event, proof submission, or settlement transaction has been broadcast during this polling period.

The authorized next action remains unchanged: once the official service returns a valid proof payload, the buyer testnet signer will submit it to the deployed CC3 ASC, record the `EscrowReleased` receipt, and verify the `QueryAlreadyProcessed` replay guard.
