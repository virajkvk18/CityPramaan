export async function sha256Hex(input: string) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));

  return `0x${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

export async function createProofBundleHash(parts: Array<string | number | boolean | null | undefined>) {
  return sha256Hex(
    parts
      .map((part) => String(part ?? ""))
      .join("|")
  );
}

export async function deriveTransactionHash(seed: string) {
  const hash = await sha256Hex(seed);

  return `${hash.slice(0, 14)}...${hash.slice(-8)}`;
}

export function shortHash(hash: string) {
  if (!hash || hash.length <= 22) {
    return hash;
  }

  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}
