export function normaliseString(mystring: string | null): string | null {
  if (!mystring) return null;
  return mystring.toLowerCase();
}
