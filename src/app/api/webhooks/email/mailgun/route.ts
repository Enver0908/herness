import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ingestInboundMessage } from "@/lib/inbound";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  if (!isValidMailgunSignature(formData)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }
  const from = String(formData.get("from") ?? "").trim();
  const sender = String(formData.get("sender") ?? from).trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body =
    String(formData.get("stripped-text") ?? "").trim() ||
    String(formData.get("body-plain") ?? "").trim() ||
    subject;
  const providerMessageId = String(formData.get("Message-Id") ?? formData.get("message-id") ?? "").trim();

  if (!from || !body) {
    return NextResponse.json({ error: "missing_email_or_body" }, { status: 400 });
  }

  const result = await ingestInboundMessage({
    body,
    channel: "Email",
    guestEmail: sender,
    guestName: from,
    provider: "mailgun_eu_inbound",
    providerMessageId: providerMessageId || null,
    subject,
  });

  return NextResponse.json({
    received: true,
    provider: "mailgun_eu_inbound",
    queuedForRiskGate: result.queued,
    result,
  });
}

function isValidMailgunSignature(formData: FormData) {
  const signingKey = process.env.MAILGUN_SIGNING_KEY;
  if (!signingKey) return true;

  const timestamp = String(formData.get("timestamp") ?? "");
  const token = String(formData.get("token") ?? "");
  const signature = String(formData.get("signature") ?? "");

  if (!timestamp || !token || !signature) return false;

  const expected = createHmac("sha256", signingKey)
    .update(`${timestamp}${token}`)
    .digest("hex");

  return safeEqual(expected, signature);
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
