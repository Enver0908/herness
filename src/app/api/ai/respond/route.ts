import { NextResponse } from "next/server";
import { buildAiDraftPrompt } from "@/lib/ai-draft";
import { createOpenAiDraft } from "@/lib/openai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureWorkspace } from "@/lib/workspace";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    conversationId?: string;
    message?: string;
    propertyId?: string;
  };
  const conversationId = body.conversationId?.trim();
  const message = body.message?.trim();

  if (!conversationId && !message) {
    return NextResponse.json(
      { error: "conversationId or message is required" },
      { status: 400 },
    );
  }

  const workspace = await ensureWorkspace(user.id, user.email);
  const admin = createAdminClient();

  if (!conversationId) {
    return NextResponse.json({
      propertyId: body.propertyId ?? null,
      status: "needs_review",
      piiSentToModel: false,
      reason: "conversation_required_for_draft_persistence",
    });
  }

  const { data: conversation, error } = await admin
    .from("conversations")
    .select("id, property_id, guest_display_name, language, properties(name), messages(body, direction)")
    .eq("id", conversationId)
    .eq("organization_id", workspace.organizationId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const inbound = conversation.messages?.find(
    (item: { body: string; direction: string }) => item.direction === "inbound",
  );

  if (!inbound || !conversation.property_id) {
    return NextResponse.json(
      { error: "conversation_missing_inbound_message_or_property" },
      { status: 400 },
    );
  }

  const { data: documents, error: documentsError } = await admin
    .from("knowledge_documents")
    .select("id, title, body")
    .eq("organization_id", workspace.organizationId)
    .eq("property_id", conversation.property_id)
    .eq("approved", true);

  if (documentsError) {
    throw documentsError;
  }

  const property = Array.isArray(conversation.properties)
    ? conversation.properties[0]
    : conversation.properties;
  const prompt = buildAiDraftPrompt({
    guestLanguage: conversation.language,
    guestMessage: inbound.body,
    knowledgeSources: documents ?? [],
    propertyName: property?.name ?? "Unknown property",
  });

  if (!prompt.prompt) {
    await admin
      .from("conversations")
      .update({
        approval_status: prompt.blockedReason,
        risk: "high",
        status: "needs_review",
      })
      .eq("id", conversationId)
      .eq("organization_id", workspace.organizationId);

    await admin.from("audit_logs").insert({
      actor_user_id: user.id,
      entity_id: conversationId,
      entity_type: "conversation",
      event_type: "ai.needs_review",
      metadata: { reason: prompt.blockedReason, pii_sent_to_model: false },
      organization_id: workspace.organizationId,
    });

    return NextResponse.json({
      status: "needs_review",
      reason: prompt.blockedReason,
      piiSentToModel: false,
    });
  }

  let draft: { model: string; text: string };

  try {
    draft = await createOpenAiDraft(prompt.prompt);
  } catch (error) {
    await admin
      .from("conversations")
      .update({
        approval_status: "openai_error",
        risk: "high",
        status: "needs_review",
      })
      .eq("id", conversationId)
      .eq("organization_id", workspace.organizationId);

    await admin.from("audit_logs").insert({
      actor_user_id: user.id,
      entity_id: conversationId,
      entity_type: "conversation",
      event_type: "ai_draft.failed",
      metadata: {
        message: error instanceof Error ? error.message : "Unknown OpenAI error",
        pii_sent_to_model: false,
      },
      organization_id: workspace.organizationId,
    });

    return NextResponse.json(
      { error: "openai_error", piiSentToModel: false },
      { status: 502 },
    );
  }

  const sourceLabel = prompt.sources.map((source) => source.title).join(", ");

  await admin.from("messages").insert({
    ai_confidence: 0.7,
    ai_model: draft.model,
    approval_status: "draft",
    body: draft.text,
    conversation_id: conversationId,
    direction: "ai_draft",
    organization_id: workspace.organizationId,
  });

  await admin
    .from("conversations")
    .update({
      ai_confidence: 0.7,
      ai_model: draft.model,
      approval_status: "draft",
      risk: "low",
      source_label: sourceLabel,
      status: "draft",
    })
    .eq("id", conversationId)
    .eq("organization_id", workspace.organizationId);

  await admin.from("audit_logs").insert({
    actor_user_id: user.id,
    entity_id: conversationId,
    entity_type: "ai_decision",
    event_type: "ai_draft.generated",
    metadata: {
      model: draft.model,
      pii_sent_to_model: false,
      source_label: sourceLabel,
    },
    organization_id: workspace.organizationId,
  });

  return NextResponse.json({
    conversationId,
    draft: draft.text,
    model: draft.model,
    piiSentToModel: false,
    sourceLabel,
    status: "draft_created",
  });
}
