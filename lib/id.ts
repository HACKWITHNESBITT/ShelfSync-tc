import { randomBytes } from "node:crypto"

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz"

/**
 * Generates a short, URL-safe, collision-resistant id (cuid-style).
 * Prefix helps make ids self-describing in logs (e.g. "br_", "pr_").
 */
export function createId(prefix = ""): string {
  const bytes = randomBytes(16)
  let out = ""
  for (let i = 0; i < bytes.length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return prefix ? `${prefix}_${out}` : out
}
