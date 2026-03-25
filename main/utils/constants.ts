// ABIs are auto-generated -> edit smart-contracts/contracts/*.sol then run:
//   cd smart-contracts && npm run build
export {
  JobEscrow_ABI as ESCROW_ABI,
  VCRegistry_ABI as VC_REGISTRY_ABI,
} from "./abis.generated";

export const POL_TO_SGD_RATE = 6.5721; // 1 SGD = 6.5721 POL
export const SGD_TO_POL_RATE = 1 / POL_TO_SGD_RATE; // 1 POL = 0.1522 SGD

/**
 * Format a date to a consistent string format (YYYY-MM-DD, HH:MM:SS AM/PM)
 * Avoids hydration errors by using a locale-independent format
 */
export function formatDateConsistent(date: Date | string | number): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours() % 12 || 12).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Format a date to a simple date string (MM/DD/YYYY)
 * Avoids hydration errors by using a locale-independent format
 */
export function formatDateOnly(date: Date | string | number): string {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}
