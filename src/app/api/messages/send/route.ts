import { NextResponse } from "next/server";
import { sendOutboundMessage } from "@/lib/providers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureWorkspace } from "@/lib/workspace";

type ConversationRow = {
  channel: "WhatsApp" | "Email";
  guest_email: string | null;
  guest_phone: string | null;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { conversationId?: string; message?: string };
  const conversationId = body.conversationId?.trim();
  const message = body.message?.trim();

  if (!conversationId || !message) {
    return NextResponse.json({ error: "conversationId and message are required" }, { status: 400 });
  }

  const workspace = await ensureWorkspace(user.id, user.email);
  const admin = createAdminClient();
  const { data: conversation, error } = await admin
    .from("conversations")
    .select("channel, guest_email, guest_phone")
    .eq("id", conversationId)
    .eq("organization_id", workspace.organizationId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const typedConversation = conversation as ConversationRow;
  const recipient =
    typedConversation.channel === "WhatsApp"
      ? typedConversation.guest_phone
      : typedConversation.guest_email;

  if (!recipient) {
    return NextResponse.json({ error: "recipient_missing" }, { status: 400 });
  }

  const delivery = await sendOutboundMessage({
    body: message,
    channel: typedConversation.channel,
    recipient,
  });

  await admin.from("messages").insert({
    approval_status: "operator_sent",
    body: message,
    conversation_id: conversationId,
    delivery_status: delivery.status,
    direction: "outbound",
    organization_id: workspace.organizationId,
    provider: delivery.provider,
    provider_message_id: delivery.providerMessageId ?? null,
  });

  await admin.from("audit_logs").insert({
    actor_user_id: user.id,
    entity_id: conversationId,
    entity_type: "conversation",
    event_type: "message.operator_sent",
    metadata: { delivery_status: delivery.status, provider: delivery.provider },
    organization_id: workspace.organizationId,
  });

  return NextResponse.json({ delivery, status: "sent" });
}
