import { enqueueAiJob } from "@/lib/ai/jobs";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function resolvePilotWorkspace(admin: AdminClient) {
  const configuredOrganizationId = process.env.HOSTOPS_DEFAULT_ORGANIZATION_ID;
  const configuredPropertyId = process.env.HOSTOPS_DEFAULT_PROPERTY_ID;

  if (configuredOrganizationId) {
    return {
      organizationId: configuredOrganizationId,
      propertyId: configuredPropertyId ?? await firstPropertyId(admin, configuredOrganizationId),
    };
  }

  const { data, error } = await admin
    .from("organizations")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error) throw error;

  return {
    organizationId: data.id as string,
    propertyId: configuredPropertyId ?? await firstPropertyId(admin, data.id as string),
  };
}

export async function ingestInboundMessage(input: {
  body: string;
  channel: "WhatsApp" | "Email";
  guestEmail?: string | null;
  guestName: string;
  guestPhone?: string | null;
  language?: string;
  propertyId?: string | null;
  provider: string;
  providerMessageId?: string | null;
  providerThreadId?: string | null;
  reservationId?: string | null;
  subject?: string | null;
}) {
  const admin = createAdminClient();
  const workspace = await resolvePilotWorkspace(admin);
  const propertyId = input.propertyId ?? workspace.propertyId ?? null;

  if (input.providerMessageId) {
    const { data: existing, error: existingError } = await admin
      .from("messages")
      .select("id")
      .eq("provider", input.provider)
      .eq("provider_message_id", input.providerMessageId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      return { duplicate: true, messageId: existing.id as string, queued: false };
    }
  }

  const conversation = await findOrCreateConversation({
    admin,
    channel: input.channel,
    guestEmail: input.guestEmail,
    guestName: input.guestName,
    guestPhone: input.guestPhone,
    language: input.language,
    organizationId: workspace.organizationId,
    propertyId,
    provider: input.provider,
    providerThreadId: input.providerThreadId,
    reservationId: input.reservationId,
  });

  const { data: message, error: messageError } = await admin
    .from("messages")
    .insert({
      body: input.body,
      conversation_id: conversation.id,
      direction: "inbound",
      delivery_status: "received",
      organization_id: workspace.organizationId,
      provider: input.provider,
      provider_message_id: input.providerMessageId ?? null,
    })
    .select("id")
    .single();

  if (messageError) throw messageError;

  await admin
    .from("conversations")
    .update({ last_provider_message_id: input.providerMessageId ?? null })
    .eq("id", conversation.id)
    .eq("organization_id", workspace.organizationId);

  await enqueueAiJob({
    admin,
    conversationId: conversation.id,
    messageId: message.id as string,
    organizationId: workspace.organizationId,
  });

  await admin.from("audit_logs").insert({
    entity_id: conversation.id,
    entity_type: "conversation",
    event_type: "message.inbound_queued_for_ai",
    metadata: {
      channel: input.channel,
      provider: input.provider,
      provider_message_id: input.providerMessageId,
      provider_thread_id: input.providerThreadId,
      subject: input.subject,
    },
    organization_id: workspace.organizationId,
  });

  return {
    conversationId: conversation.id as string,
    duplicate: false,
    messageId: message.id as string,
    queued: true,
  };
}

async function findOrCreateConversation(input: {
  admin: AdminClient;
  channel: "WhatsApp" | "Email";
  guestEmail?: string | null;
  guestName: string;
  guestPhone?: string | null;
  language?: string;
  organizationId: string;
  propertyId?: string | null;
  provider: string;
  providerThreadId?: string | null;
  reservationId?: string | null;
}) {
  if (input.providerThreadId) {
    const { data, error } = await input.admin
      .from("conversations")
      .select("id")
      .eq("organization_id", input.organizationId)
      .eq("provider", input.provider)
      .eq("provider_thread_id", input.providerThreadId)
      .maybeSingle();

    if (error) throw error;
    if (data?.id) return { id: data.id as string };
  }

  const { data: conversation, error: conversationError } = await input.admin
    .from("conversations")
    .insert({
      channel: input.channel,
      guest_display_name: input.guestName,
      guest_email: input.guestEmail ?? null,
      guest_phone: input.guestPhone ?? null,
      language: input.language ?? "English",
      organization_id: input.organizationId,
      property_id: input.propertyId ?? null,
      provider: input.provider,
      provider_thread_id: input.providerThreadId ?? null,
      reservation_id: input.reservationId ?? null,
      risk: "medium",
      status: "draft",
    })
    .select("id")
    .single();

  if (conversationError) throw conversationError;
  return { id: conversation.id as string };
}

async function firstPropertyId(admin: AdminClient, organizationId: string) {
  const { data, error } = await admin
    .from("properties")
    .select("id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id as string | undefined;
}
