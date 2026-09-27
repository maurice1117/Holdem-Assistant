import "server-only";

import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
export const ADMIN_SESSION_COOKIE = "holdem_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured.");
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export async function verifySharedPassword(password: string): Promise<boolean> {
  const serializedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!serializedHash) throw new Error("ADMIN_PASSWORD_HASH is not configured.");

  const [algorithm, salt, expected] = serializedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;

  const derivedKey = await scrypt(password, Buffer.from(salt, "base64url"), 64);
  const actual = Buffer.from(derivedKey as ArrayBuffer);
  const expectedBuffer = Buffer.from(expected, "base64url");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export function createAdminSession(): { token: string; maxAge: number } {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_SECONDS * 1000, nonce: randomBytes(12).toString("base64url") })).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, maxAge: SESSION_TTL_SECONDS };
}

export function isValidAdminSession(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}
