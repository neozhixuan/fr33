# compliance-service

Compliance microservice for:

1. VC issuance / revocation integration with `VCRegistry`
2. Escrow activity ingestion from subgraph GraphQL endpoint
3. Deterministic compliance rule evaluation and case creation

## What this service now does

- Polls the subgraph endpoint periodically
- Ingests indexed escrow events into `compliance_service.escrow_activity`
- Evaluates 3 deterministic rules:
  - `LARGE_ESCROW_ANOMALY`
  - `HIGH_DISPUTE_FREQUENCY`
  - `BURST_ACTIVITY`
- Stores each triggered rule with threshold + observed metadata
- Accumulates risk score per wallet profile
- Opens compliance cases when score exceeds threshold
- Supports admin actions:
  - dismiss case
  - action case by revoking VC on-chain

## Setup

1. Fill env values in `.env` (see `.env.example`)
2. Ensure DB can create/use schemas:
   - `issuer_service`
   - `compliance_service`
3. Run Prisma setup:
   - `npm run prisma-setup`
4. Start service:
   - dev: `npm run dev`
   - prod: `npm run build && npm run start`

## HTTP endpoints

- `POST /vc/issue`

  - existing VC issuance endpoint

- `GET /compliance/cases?status=OPEN&wallet=0x...`

  - list cases (status and wallet filter optional)

- `POST /compliance/cases/:caseId/dismiss`

  - body: `{ "notes": "false positive" }`

- `POST /compliance/cases/:caseId/revoke-vc`

  - body: `{ "vcHash": "<vc-hash>", "notes": "revoked after review" }`
  - triggers on-chain `revokeCredential(vcHash)` and marks case `ACTIONED`

- `GET /compliance/profiles/:wallet`
  - wallet compliance profile with recent triggers/cases

## Rule assumptions

Current smart contract does not emit an explicit dispute event. For this demonstrator:

- `JOB_CANCELLED` is treated as dispute-like signal.

This can be replaced later with explicit dispute events when contract support is added.

## Example

A job was funded and unfunded repeatedly, starting a compliance case.

To debug:

```sh
curl http://localhost:3001/compliance/profiles/<wallet>
# in this case it is 0x22797D6e421e0724cc82c2CFD591c61e8E7AB601
```

```json
{
  "profile": {
    "id": 1,
    "walletAddress": "0x22797d6e421e0724cc82c2cfd591c61e8e7ab601",
    "cumulativeScore": 150,
    "lastTriggeredAt": "2026-03-22T08:49:31.000Z",
    "createdAt": "2026-03-22T08:39:21.052Z",
    "updatedAt": "2026-03-22T08:50:25.159Z",
    "ruleTriggers": [
      {
        "id": 5,
        "profileId": 1,
        "ruleName": "BURST_ACTIVITY",
        "scoreDelta": 30,
        "threshold": { "minEventCount": 4, "windowMinutes": 30 },
        "observed": { "eventCount": 8 },
        "sourceEventId": "0x358cb7319ac9b2c48644808c6a1a1e858f1af39f477920a61cb2778444512459-6",
        "sourceTxHash": "0x358cb7319ac9b2c48644808c6a1a1e858f1af39f477920a61cb2778444512459",
        "fingerprint": "BURST_ACTIVITY:0x22797d6e421e0724cc82c2cfd591c61e8e7ab601:0x358cb7319ac9b2c48644808c6a1a1e858f1af39f477920a61cb2778444512459-6",
        "caseId": 1,
        "triggeredAt": "2026-03-22T08:50:25.157Z"
      },
      {
        "id": 4,
        "profileId": 1,
        "ruleName": "BURST_ACTIVITY",
        "scoreDelta": 30,
        "threshold": { "minEventCount": 4, "windowMinutes": 30 },
        "observed": { "eventCount": 7 },
        "sourceEventId": "0x88ac5352ef4b528e1262ff165d98a3ec286db81fb2fb3c08b4c32d5a94f3ff63-7",
        "sourceTxHash": "0x88ac5352ef4b528e1262ff165d98a3ec286db81fb2fb3c08b4c32d5a94f3ff63",
        "fingerprint": "BURST_ACTIVITY:0x22797d6e421e0724cc82c2cfd591c61e8e7ab601:0x88ac5352ef4b528e1262ff165d98a3ec286db81fb2fb3c08b4c32d5a94f3ff63-7",
        "caseId": 1,
        "triggeredAt": "2026-03-22T08:50:10.147Z"
      },
      {
        "id": 3,
        "profileId": 1,
        "ruleName": "BURST_ACTIVITY",
        "scoreDelta": 30,
        "threshold": { "minEventCount": 4, "windowMinutes": 30 },
        "observed": { "eventCount": 6 },
        "sourceEventId": "0x88ac5352ef4b528e1262ff165d98a3ec286db81fb2fb3c08b4c32d5a94f3ff63-6",
        "sourceTxHash": "0x88ac5352ef4b528e1262ff165d98a3ec286db81fb2fb3c08b4c32d5a94f3ff63",
        "fingerprint": "BURST_ACTIVITY:0x22797d6e421e0724cc82c2cfd591c61e8e7ab601:0x88ac5352ef4b528e1262ff165d98a3ec286db81fb2fb3c08b4c32d5a94f3ff63-6",
        "caseId": null,
        "triggeredAt": "2026-03-22T08:50:10.129Z"
      },
      {
        "id": 2,
        "profileId": 1,
        "ruleName": "BURST_ACTIVITY",
        "scoreDelta": 30,
        "threshold": { "minEventCount": 4, "windowMinutes": 30 },
        "observed": { "eventCount": 5 },
        "sourceEventId": "0x48b95f6b96cd72e345faa9c5ff8fd1ab23519c8e60a22041f78f53e43b96ae0b-2",
        "sourceTxHash": "0x48b95f6b96cd72e345faa9c5ff8fd1ab23519c8e60a22041f78f53e43b96ae0b",
        "fingerprint": "BURST_ACTIVITY:0x22797d6e421e0724cc82c2cfd591c61e8e7ab601:0x48b95f6b96cd72e345faa9c5ff8fd1ab23519c8e60a22041f78f53e43b96ae0b-2",
        "caseId": null,
        "triggeredAt": "2026-03-22T08:48:50.088Z"
      },
      {
        "id": 1,
        "profileId": 1,
        "ruleName": "BURST_ACTIVITY",
        "scoreDelta": 30,
        "threshold": { "minEventCount": 4, "windowMinutes": 30 },
        "observed": { "eventCount": 4 },
        "sourceEventId": "0x761ad2a27aa8ad11640ac439b69a3ea9184546801c5c763665bfbe525b4feda2-3",
        "sourceTxHash": "0x761ad2a27aa8ad11640ac439b69a3ea9184546801c5c763665bfbe525b4feda2",
        "fingerprint": "BURST_ACTIVITY:0x22797d6e421e0724cc82c2cfd591c61e8e7ab601:0x761ad2a27aa8ad11640ac439b69a3ea9184546801c5c763665bfbe525b4feda2-3",
        "caseId": null,
        "triggeredAt": "2026-03-22T08:48:50.065Z"
      }
    ],
    "complianceCases": [
      {
        "id": 1,
        "profileId": 1,
        "status": "OPEN",
        "scoreAtCreation": 120,
        "triggeredRules": ["BURST_ACTIVITY"],
        "evidence": {
          "triggerIds": [4],
          "triggeredAt": "2026-03-22T08:48:39.000Z",
          "sourceTxHash": "0x88ac5352ef4b528e1262ff165d98a3ec286db81fb2fb3c08b4c32d5a94f3ff63",
          "sourceEventId": "0x88ac5352ef4b528e1262ff165d98a3ec286db81fb2fb3c08b4c32d5a94f3ff63-7",
          "walletAddress": "0x22797d6e421e0724cc82c2cfd591c61e8e7ab601",
          "triggeredRules": ["BURST_ACTIVITY"]
        },
        "actionNotes": null,
        "actionTxHash": null,
        "createdAt": "2026-03-22T08:50:10.153Z",
        "updatedAt": "2026-03-22T08:50:10.153Z",
        "closedAt": null
      }
    ]
  }
}
```

You can also just look at the case itself

```sh
http://localhost:3001/compliance/cases?wallet=0x22797D6e421e0724cc82c2CFD591c61e8E7AB601
```

```json
{
  "cases": [
    {
      "id": 1,
      "profileId": 1,
      "status": "OPEN",
      "scoreAtCreation": 120,
      "triggeredRules": ["BURST_ACTIVITY"],
      "evidence": {
        "triggerIds": [4],
        "triggeredAt": "2026-03-22T08:48:39.000Z",
        "sourceTxHash": "0x88ac5352ef4b528e1262ff165d98a3ec286db81fb2fb3c08b4c32d5a94f3ff63",
        "sourceEventId": "0x88ac5352ef4b528e1262ff165d98a3ec286db81fb2fb3c08b4c32d5a94f3ff63-7",
        "walletAddress": "0x22797d6e421e0724cc82c2cfd591c61e8e7ab601",
        "triggeredRules": ["BURST_ACTIVITY"]
      },
      "actionNotes": null,
      "actionTxHash": null,
      "createdAt": "2026-03-22T08:50:10.153Z",
      "updatedAt": "2026-03-22T08:50:10.153Z",
      "closedAt": null,
      "profile": {
        "id": 1,
        "walletAddress": "0x22797d6e421e0724cc82c2cfd591c61e8e7ab601",
        "cumulativeScore": 150,
        "lastTriggeredAt": "2026-03-22T08:49:31.000Z",
        "createdAt": "2026-03-22T08:39:21.052Z",
        "updatedAt": "2026-03-22T08:50:25.159Z"
      },
      "ruleTriggers": [
        {
          "id": 5,
          "profileId": 1,
          "ruleName": "BURST_ACTIVITY",
          "scoreDelta": 30,
          "threshold": { "minEventCount": 4, "windowMinutes": 30 },
          "observed": { "eventCount": 8 },
          "sourceEventId": "0x358cb7319ac9b2c48644808c6a1a1e858f1af39f477920a61cb2778444512459-6",
          "sourceTxHash": "0x358cb7319ac9b2c48644808c6a1a1e858f1af39f477920a61cb2778444512459",
          "fingerprint": "BURST_ACTIVITY:0x22797d6e421e0724cc82c2cfd591c61e8e7ab601:0x358cb7319ac9b2c48644808c6a1a1e858f1af39f477920a61cb2778444512459-6",
          "caseId": 1,
          "triggeredAt": "2026-03-22T08:50:25.157Z"
        },
        {
          "id": 4,
          "profileId": 1,
          "ruleName": "BURST_ACTIVITY",
          "scoreDelta": 30,
          "threshold": { "minEventCount": 4, "windowMinutes": 30 },
          "observed": { "eventCount": 7 },
          "sourceEventId": "0x88ac5352ef4b528e1262ff165d98a3ec286db81fb2fb3c08b4c32d5a94f3ff63-7",
          "sourceTxHash": "0x88ac5352ef4b528e1262ff165d98a3ec286db81fb2fb3c08b4c32d5a94f3ff63",
          "fingerprint": "BURST_ACTIVITY:0x22797d6e421e0724cc82c2cfd591c61e8e7ab601:0x88ac5352ef4b528e1262ff165d98a3ec286db81fb2fb3c08b4c32d5a94f3ff63-7",
          "caseId": 1,
          "triggeredAt": "2026-03-22T08:50:10.147Z"
        }
      ]
    }
  ]
}
```

Interpretation:

- Wallet under review: 0x22797d6e421e0724cc82c2cfd591c61e8e7ab601
- Case status: OPEN
  - Case opened because burst activity rule fired and pushed score over threshold.
- At case creation:
  - scoreAtCreation = 120
  - triggering event: sourceEventId ...-7 (JOB_CANCELLED in that tx)
  - observed burst metric: eventCount = 7 within windowMinutes = 30
  - threshold: minEventCount = 4
- After case creation, one more burst trigger happened:
  - trigger id 5, eventCount = 8
- case remained open and trigger attached to same case.
- Current profile score is now 150 (still elevated), so behavior remained high-frequency after case opened.

TLDR: this wallet performed a rapid sequence of escrow lifecycle actions (fund/cancel events), and the deterministic burst rule classified it as suspicious enough for admin review.
