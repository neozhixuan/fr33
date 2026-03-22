import { getComplianceConfig } from "./compliance.config";
import { SubgraphEscrowEvent } from "./compliance.types";

const ESCROW_EVENTS_QUERY = `
  query EscrowEventsAfter($fromTimestampExclusive: BigInt!, $first: Int!) {
    escrowEvents(
      where: { blockTimestamp_gt: $fromTimestampExclusive }
      first: $first
      orderBy: blockTimestamp
      orderDirection: asc
    ) {
      id
      jobId
      eventType
      wallet
      counterparty
      amount
      blockNumber
      blockTimestamp
      transactionHash
      logIndex
    }
  }
`;

export async function fetchEscrowEventsAfter(
  fromTimestampSec: number,
): Promise<SubgraphEscrowEvent[]> {
  const config = getComplianceConfig();

  if (!config.subgraphUrl) {
    throw new Error("COMPLIANCE_SUBGRAPH_URL is empty");
  }

  const response = await fetch(config.subgraphUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: ESCROW_EVENTS_QUERY,
      variables: {
        fromTimestampExclusive: fromTimestampSec.toString(),
        first: config.fetchBatchSize,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Subgraph HTTP error ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: { escrowEvents?: SubgraphEscrowEvent[] };
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(`Subgraph GraphQL error: ${payload.errors[0].message}`);
  }

  return payload.data?.escrowEvents || [];
}
