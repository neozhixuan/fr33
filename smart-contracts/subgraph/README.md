# Job Escrow Subgraph

This subgraph indexes lifecycle events from `JobEscrow.sol` and exposes normalized entities for compliance monitoring.

The subgraph depends directly on contract events/ABIs (JobEscrow event signatures). Keeping it near JobEscrow.sol reduces drift.

## Indexed entities

- `Job`: current snapshot of job lifecycle state
- `EscrowEvent`: append-only event stream used by downstream analytics/compliance checks

### Event mapping coverage

- `JobCreated` → `JOB_CREATED`
- `JobAccepted` → `JOB_ACCEPTED`
- `ReleaseRequested` → `RELEASE_REQUESTED`
- `FundsReleased` → `FUNDS_RELEASED`
- `JobCancelled` → `JOB_CANCELLED` (used as dispute proxy for this demo)

> Note: current smart contract does not emit an explicit dispute event. For the FYP/demo flow, cancellation is treated as dispute-like behavior.

## Local setup

### A) Fastest way (recommended): run local IPFS + Graph Node via Docker

If you do not have IPFS/Graph Node installed, use the included Docker stack.

1. Install Docker Desktop
2. In this folder, copy env file:

- copy `.env.example` to `.env`
- set `POLYGON_AMOY_RPC_URL`

3. Start stack:

- `npm run stack:up`

4. Verify endpoints:

- Graph admin: `http://127.0.0.1:8020`
- Graph query: `http://127.0.0.1:8000`
- IPFS API: `http://127.0.0.1:5001`

To stop the stack later:

- `npm run stack:down`

If graph-node crashes with `database collation ... must be C`, your Postgres data volume was initialized with the wrong locale. Reset it once:

- `docker compose down -v`
- `npm run stack:up`

---

### B) Build and deploy subgraph to local graph-node

1. Install dependencies:
   - `cd smart-contracts/subgraph`
   - `npm install`

2. Update manifest deployment values in `subgraph.yaml`:
   - `source.address` = deployed `JobEscrow` address
   - `source.startBlock` = deployment block
   - `network` = graph-supported network name for your target chain

3. Generate and build:
   - `npm run codegen` = generates GraphQL schema files in `./generated`
   - `npm run build`
  - Optional: `npm run set-start-block` (sets `startBlock` to `latest - 20`)
  - You can override the lookback window with `SUBGRAPH_START_BLOCK_OFFSET`.

4. For local graph-node deployment:
   - `npm run create-local`
   - `npm run deploy-local`
     Or run all in one:
   - `npm run deploy-local:all`

`deploy-local:all` runs `set-start-block` automatically before build/deploy.

## Example GraphQL queries

### Recent escrow events globally

```graphql
query RecentGlobalEscrowEvents {
  escrowEvents(first: 20, orderBy: blockTimestamp, orderDirection: desc) {
    id
    eventType
    wallet
    counterparty
    jobId
    amount
    blockTimestamp
    transactionHash
    logIndex
  }
}
```

### Recent escrow events for one wallet

```graphql
query WalletEscrowEvents($wallet: Bytes!) {
  escrowEvents(
    where: { wallet: $wallet }
    first: 20
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    id
    eventType
    jobId
    amount
    blockTimestamp
    transactionHash
  }
}
```

### Dispute-like activity (job cancellations) by wallet over time

```graphql
query WalletCancellationEvents($wallet: Bytes!, $fromTs: BigInt!) {
  escrowEvents(
    where: {
      wallet: $wallet
      eventType: "JOB_CANCELLED"
      blockTimestamp_gte: $fromTs
    }
    first: 100
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    id
    jobId
    blockTimestamp
    transactionHash
  }
}
```

### Rapid activity window query

```graphql
query WalletRapidWindow($wallet: Bytes!, $fromTs: BigInt!) {
  escrowEvents(
    where: { wallet: $wallet, blockTimestamp_gte: $fromTs }
    first: 200
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    id
    eventType
    blockTimestamp
    transactionHash
  }
}
```
