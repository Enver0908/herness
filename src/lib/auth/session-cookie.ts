import { createHmac, timingSafeEqual } from "crypto";

export const HOSTOPS_SESSION_COOKIE = "hostops-session";

type SessionPayload = {
  email?: string;
  exp: number;
  userId: string;
};

export function createHostopsSessionCookie({
  email,
  maxAge,
  userId,
}: {
  email?: string;
  maxAge: number;
  userId: string;
}) {
  const payload: SessionPayload = {
    email,
    exp: Math.floor(Date.now() / 1000) + maxAge,
    userId,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function readHostopsSessionCookie(value?: string | null) {
  if (!value) return null;

  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature || !isValidSignature(encodedPayload, signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || payload.exp <= Math.floor(Date.now() / 1000)) return null;

    return {
      email: payload.email,
      userId: payload.userId,
    };
  } catch {
    return null;
  }
}

function isValidSignature(payload: string, signature: string) {
  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

function sign(value: string) {
  const key = process.env.PII_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("PII_ENCRYPTION_KEY is required for session cookies.");
  }

  return createHmac("sha256", key).update(value).digest("base64url");
}
