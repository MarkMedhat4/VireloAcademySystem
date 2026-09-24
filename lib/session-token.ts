import { createHmac, timingSafeEqual } from "node:crypto";

/** Minimal signed token (HMAC-SHA256): base64url(payload).base64url(signature). Pure functions → unit-testable. */
export function signToken(payload: { sid: string; exp: number }, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/** Returns the student id if the token is authentic and not expired, otherwise null. */
export function verifyToken(token: string | undefined, secret: string, now = Date.now()): string | null {
  if (!token) return null;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const expected = createHmac("sha256", secret).update(body).digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { sid?: unknown; exp?: unknown };
    if (typeof payload.sid !== "string" || typeof payload.exp !== "number" || payload.exp < now) return null;
    return payload.sid;
  } catch {
    return null;
  }
}
