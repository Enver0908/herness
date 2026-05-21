import { NextResponse } from "next/server";
import { ingestInboundMessage } from "@/lib/inbound";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = searchParams.get("hub.verify_token");

  if (mode === "subscribe" && challenge && verifyToken === process.env.META_WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge);
  }

  return NextResponse.json({ error: "invalid verification request" }, { status: 400 });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const message = extractWhatsAppMessage(payload);

  if (!message) {
    return NextResponse.json({
      received: true,
      provider: "meta_whatsapp_cloud_api",
      queuedForRiskGate: false,
      reason: "no_text_message",
    });
  }

  const result = await ingestInboundMessage({
    body: message.body,
    channel: "WhatsApp",
    guestName: message.guestName,
    guestPhone: message.from,
    provider: "meta_whatsapp_cloud_api",
    providerMessageId: message.id,
  });

  return NextResponse.json({
    received: true,
    provider: "meta_whatsapp_cloud_api",
    queuedForRiskGate: result.queued,
    result,
  });
}

function extractWhatsAppMessage(payload: unknown) {
  const entry = (payload as { entry?: unknown[] }).entry?.[0] as { changes?: unknown[] } | undefined;
  const change = entry?.changes?.[0] as { value?: { contacts?: { profile?: { name?: string }; wa_id?: string }[]; messages?: { from?: string; id?: string; text?: { body?: string }; type?: string }[] } } | undefined;
  const message = change?.value?.messages?.[0];

  if (!message?.id || !message.from || message.type !== "text" || !message.text?.body) {
    return null;
  }

  return {
    body: message.text.body,
    from: message.from,
    guestName: change?.value?.contacts?.[0]?.profile?.name ?? message.from,
    id: message.id,
  };
}
