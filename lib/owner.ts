import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * What a token is for: proving who uploaded a file, so what they make from it
 * may delete it; deleting a chat with its files; deleting a parse alone, or a
 * parse with the file it read
 */
export type OwnerPurpose = "file" | "chat" | "parse" | "parse-file";

/**
 * Labs has no accounts, so whoever makes something gets a token for it, which
 * only their browser keeps. Each is signed with this secret, so nothing needs
 * storing to check one. Without it, nothing gets a token and nothing can be
 * deleted.
 */
function secret(): string | undefined {
  return process.env.OWNER_TOKEN_SECRET || undefined;
}

function signWith(key: string, purpose: OwnerPurpose, id: string): string {
  return createHmac("sha256", key)
    .update(`${purpose}:${id}`)
    .digest("base64url");
}

export function ownerToken(
  purpose: OwnerPurpose,
  id: string
): string | undefined {
  const key = secret();
  return key ? signWith(key, purpose, id) : undefined;
}

export function isOwner(
  purpose: OwnerPurpose,
  id: string,
  token: string | null | undefined
): boolean {
  const key = secret();
  if (!key || !token) return false;
  const expected = Buffer.from(signWith(key, purpose, id));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
