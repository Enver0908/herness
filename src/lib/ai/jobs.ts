import { buildAutoReplyPrompt, decideGuestAutomation, safeEscalationReply, type AiAutomationDecision } from "@/lib/ai/triage";
import { createOpenAiDraft } from "@/lib/openai";
import { createOperationCase } from "@/lib/operations";
import { sendOutboundMessage } from "@/lib/providers";
import { createAdminClient } from "@/lib/supabase/admin";
import { one } from "@/lib/supabase/relations";

type AdminClient = ReturnType<typeof createAdminClient>;

type JobRow = {
  id: string;
  organization_id: string;
  conversation_id: string;
  message_id: string | null;
};

type ConversationRow = {
  id: string;
  channel: "WhatsApp" | "Email";
  guest_display_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  language: string;
  property_id: string | null;
  reservation_id: string | null;
  properties: { name: string } | { name: string }[] | null;
};

type MessageRow = {
  id: string;
  body: string;
};

export async function enqueueAiJob(input: {
  admin: AdminClient;
  conversationId: string;
  messageId: string;
  organizationId: string;
}) {
  const { error } = await input.admin.from("ai_jobs").insert({
    conversation_id: input.conversationId,
    message_id: input.messageId,
    organization_id: input.organizationId,
  });

  if (error) throw error;
}

export async function processPendingAiJobs(limit = 5) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ai_jobs")
    .select("id, organization_id, conversation_id, message_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  const results = [];
  for (const job of (data ?? []) as JobRow[]) {
    results.push(await processAiJob(admin, job));
  }

  return results;
}

export async function processAiJob(admin: AdminClient, job: JobRow) {
  await admin
    .from("ai_jobs")
    .update({ attempts: 1, last_error: null, status: "running" })
    .eq("id", job.id)
    .eq("status", "pending");

  try {
    const result = await runAutomation(admin, job);
    await admin.from("ai_jobs").update({ status: "done" }).eq("id", job.id);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI job error";
    await admin
      .from("ai_jobs")
      .update({ last_error: message, status: "failed" })
      .eq("id", job.id);
    return { error: message, jobId: job.id, status: "failed" };
  }
}

export async function processConversationNow(input: {
  admin: AdminClient;
  conversationId: string;
  organizationId: string;
}) {
  const { data: inbound, error } = await input.admin
    .from("messages")
    .select("id")
    .eq("conversation_id", input.conversationId)
    .eq("organization_id", input.organizationId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;

  const { data: job, error: jobError } = await input.admin
    .from("ai_jobs")
    .insert({
      conversation_id: input.conversationId,
      message_id: inbound.id,
      organization_id: input.organizationId,
    })
    .select("id, organization_id, conversation_id, message_id")
    .single();

  if (jobError) throw jobError;

  return processAiJob(input.admin, job as JobRow);
}

async function runAutomation(admin: AdminClient, job: JobRow) {
  const { data: conversation, error: conversationError } = await admin
    .from("conversations")
    .select("id, channel, guest_display_name, guest_email, guest_phone, language, property_id, reservation_id, properties(name)")
    .eq("id", job.conversation_id)
    .eq("organization_id", job.organization_id)
    .single();

  if (conversationError) throw conversationError;

  const { data: inbound, error: messageError } = await admin
    .from("messages")
    .select("id, body")
    .eq("id", job.message_id)
    .eq("organization_id", job.organization_id)
    .single();

  if (messageError) throw messageError;

  const typedConversation = conversation as ConversationRow;
  const typedInbound = inbound as MessageRow;

  const { data: documents, error: documentsError } = await admin
    .from("knowledge_documents")
    .select("id, title, body")
    .eq("organization_id", job.organization_id)
    .eq("property_id", typedConversation.property_id)
    .eq("approved", true);

  if (documentsError) throw documentsError;

  const property = one(typedConversation.properties);
  const decision: AiAutomationDecision = decideGuestAutomation({
    guestMessage: typedInbound.body,
    knowledgeSources: documents ?? [],
    propertyName: property?.name ?? "Unknown property",
  });
  const sourceLabel = decision.sources.map((source) => source.title).join(", ");

  const { data: settingsData } = await admin
    .from("organization_settings")
    .select("quiet_hours_start, quiet_hours_end, waste_sorting_rules, local_tourist_tax_czk, other_rules")
    .eq("organization_id", job.organization_id)
    .maybeSingle();

  const settings = settingsData ? {
    quietHoursStart: settingsData.quiet_hours_start,
    quietHoursEnd: settingsData.quiet_hours_end,
    wasteSortingRules: settingsData.waste_sorting_rules,
    localTouristTaxCzk: Number(settingsData.local_tourist_tax_czk),
    otherRules: settingsData.other_rules,
  } : undefined;

  const reply = decision.canAutoSend
    ? (await createOpenAiDraft(buildAutoReplyPrompt({
        decision,
        guestLanguage: typedConversation.language,
        propertyName: property?.name ?? "Unknown property",
        settings,
      }))).text
    : safeEscalationReply();

  const recipient =
    typedConversation.channel === "WhatsApp"
      ? typedConversation.guest_phone
      : typedConversation.guest_email;

  if (!recipient) {
    if (!decision.canAutoSend) {
      await admin.from("ai_decisions").insert({
        can_auto_send: false,
        category: decision.category,
        confidence: decision.confidence,
        conversation_id: job.conversation_id,
        delivery_status: "not_sent",
        escalation_reason: decision.escalationReason ?? "missing_recipient",
        message_id: typedInbound.id,
        model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
        organization_id: job.organization_id,
        pii_detected: decision.piiDetected,
        provider: null,
        reason: `${decision.reason} No recipient was available for acknowledgement.`,
        risk: decision.risk,
        source_label: sourceLabel || null,
      });

      await createOperationCase({
        admin,
        caseType: decision.escalationReason ?? "missing_recipient",
        conversationId: job.conversation_id,
        messageId: typedInbound.id,
        organizationId: job.organization_id,
        propertyId: typedConversation.property_id,
        reservationId: typedConversation.reservation_id,
        risk: decision.risk,
        summary: `${decision.reason} No recipient was available for acknowledgement.`,
      });

      await admin
        .from("conversations")
        .update({
          ai_confidence: decision.confidence,
          ai_model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
          approval_status: decision.escalationReason ?? "missing_recipient",
          risk: decision.risk,
          source_label: sourceLabel || null,
          status: "needs_review",
        })
        .eq("id", job.conversation_id)
        .eq("organization_id", job.organization_id);

      return {
        autoSent: false,
        conversationId: job.conversation_id,
        deliveryStatus: "not_sent",
        jobId: job.id,
        status: "done",
      };
    }

    throw new Error("Conversation recipient is missing.");
  }

  const delivery = await sendOutboundMessage({
    body: reply,
    channel: typedConversation.channel,
    recipient,
    subject: `Re: ${property?.name ?? "Your stay"}`,
  });

  const outboundDirection = decision.canAutoSend ? "outbound" : "outbound";
  await admin.from("messages").insert({
    ai_confidence: decision.confidence,
    ai_model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
    approval_status: decision.canAutoSend ? "auto_sent" : "escalated_ack_sent",
    body: reply,
    conversation_id: job.conversation_id,
    delivery_status: delivery.status,
    direction: outboundDirection,
    organization_id: job.organization_id,
    provider: delivery.provider,
    provider_message_id: delivery.providerMessageId ?? null,
  });

  await admin.from("ai_decisions").insert({
    can_auto_send: decision.canAutoSend,
    category: decision.category,
    confidence: decision.confidence,
    conversation_id: job.conversation_id,
    delivery_status: delivery.status,
    escalation_reason: decision.escalationReason ?? null,
    message_id: typedInbound.id,
    model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
    organization_id: job.organization_id,
    pii_detected: decision.piiDetected,
    provider: delivery.provider,
    reason: decision.reason,
    risk: decision.risk,
    source_label: sourceLabel || null,
  });

  if (!decision.canAutoSend) {
    await createOperationCase({
      admin,
      caseType: decision.escalationReason ?? decision.category,
      conversationId: job.conversation_id,
      messageId: typedInbound.id,
      organizationId: job.organization_id,
      propertyId: typedConversation.property_id,
      reservationId: typedConversation.reservation_id,
      risk: decision.risk,
      summary: decision.reason,
    });
  }

  await admin
    .from("conversations")
    .update({
      ai_confidence: decision.confidence,
      ai_model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      approval_status: decision.canAutoSend ? "auto_sent" : decision.escalationReason,
      risk: decision.risk,
      source_label: sourceLabel || null,
      status: decision.canAutoSend ? "auto_sent" : "needs_review",
    })
    .eq("id", job.conversation_id)
    .eq("organization_id", job.organization_id);

  await admin.from("audit_logs").insert({
    entity_id: job.conversation_id,
    entity_type: "ai_decision",
    event_type: decision.canAutoSend ? "ai.auto_sent" : "ai.escalated_ack_sent",
    metadata: {
      category: decision.category,
      delivery_status: delivery.status,
      pii_sent_to_model: false,
      source_label: sourceLabel,
    },
    organization_id: job.organization_id,
  });

  return {
    autoSent: decision.canAutoSend,
    conversationId: job.conversation_id,
    deliveryStatus: delivery.status,
    jobId: job.id,
    status: "done",
  };
}
