// ABIs are auto-generated -> edit smart-contracts/contracts/*.sol then run:
//   cd smart-contracts && npm run build
export {
  JobEscrow_ABI as ESCROW_ABI,
  VCRegistry_ABI as VC_REGISTRY_ABI,
} from "./abis.generated";

export const POL_TO_SGD_RATE = 6.5721; // 1 SGD = 6.5721 POL

/**
 * Format a date to a consistent string format (YYYY-MM-DD, HH:MM:SS AM/PM)
 * Avoids hydration errors by using a locale-independent UTC format
 */
export function formatDateConsistent(date: Date | string | number): string {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hour24 = d.getUTCHours();
  const hours = String(hour24 % 12 || 12).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");
  const ampm = hour24 >= 12 ? "PM" : "AM";
  return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Format a date to a simple date string (MM/DD/YYYY)
 * Avoids hydration errors by using a locale-independent UTC format
 */
export function formatDateOnly(date: Date | string | number): string {
  const d = new Date(date);
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${month}/${day}/${year}`;
}
