"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { processConversationNow } from "@/lib/ai/jobs";
import { buildAiDraftPrompt } from "@/lib/ai-draft";
import { createOpenAiDraft } from "@/lib/openai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureWorkspace } from "@/lib/workspace";

async function getWorkspaceForAction() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return {
    userId: user.id,
    workspace: await ensureWorkspace(user.id, user.email),
  };
}

export async function createProperty(formData: FormData) {
  const { userId, workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const channel = String(formData.get("channel") ?? "Airbnb").trim();

  if (!name || !area || !address) {
    throw new Error("Property name, area, and address are required.");
  }

  const { data, error } = await admin
    .from("properties")
    .insert({
      address,
      area,
      channel,
      knowledge_health: 0,
      name,
      organization_id: workspace.organizationId,
    })
    .select("id")
    .single();

  if (error) throw error;

  await admin.from("audit_logs").insert({
    actor_user_id: userId,
    entity_id: data.id,
    entity_type: "property",
    event_type: "property.created",
    organization_id: workspace.organizationId,
  });

  revalidatePath("/dashboard");
}

export async function updateProperty(formData: FormData) {
  const { workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const id = String(formData.get("propertyId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const channel = String(formData.get("channel") ?? "Airbnb").trim();

  if (!id || !name || !area || !address) {
    throw new Error("Property id, name, area, and address are required.");
  }

  const { error } = await admin
    .from("properties")
    .update({ address, area, channel, name })
    .eq("id", id)
    .eq("organization_id", workspace.organizationId);

  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function deleteProperty(formData: FormData) {
  const { workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const id = String(formData.get("propertyId") ?? "");

  if (!id) throw new Error("Property id is required.");

  const { error } = await admin
    .from("properties")
    .delete()
    .eq("id", id)
    .eq("organization_id", workspace.organizationId);

  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function createReservation(formData: FormData) {
  const { userId, workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const propertyId = String(formData.get("propertyId") ?? "");
  const guestDisplayName = String(formData.get("guestDisplayName") ?? "").trim();
  const guestEmail = String(formData.get("guestEmail") ?? "").trim();
  const arrivalDate = String(formData.get("arrivalDate") ?? "");
  const departureDate = String(formData.get("departureDate") ?? "");

  if (!propertyId || !guestDisplayName || !arrivalDate) {
    throw new Error("Property, guest name, and arrival date are required.");
  }

  const token = randomUUID();
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

  const { data: reservation, error: reservationError } = await admin
    .from("reservations")
    .insert({
      arrival_date: arrivalDate,
      check_in_token: token,
      departure_date: departureDate || null,
      guest_display_name: guestDisplayName,
      guest_email: guestEmail || null,
      organization_id: workspace.organizationId,
      property_id: propertyId,
      token_expires_at: tokenExpiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (reservationError) throw reservationError;

  const { error: complianceError } = await admin.from("compliance_forms").insert({
    organization_id: workspace.organizationId,
    reservation_id: reservation.id,
    status: "missing",
  });

  if (complianceError) throw complianceError;

  await admin.from("audit_logs").insert({
    actor_user_id: userId,
    entity_id: reservation.id,
    entity_type: "reservation",
    event_type: "reservation.created",
    metadata: { check_in_token: token },
    organization_id: workspace.organizationId,
  });

  revalidatePath("/dashboard");
}

export async function updateReservation(formData: FormData) {
  const { workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const id = String(formData.get("reservationId") ?? "");
  const propertyId = String(formData.get("propertyId") ?? "");
  const guestDisplayName = String(formData.get("guestDisplayName") ?? "").trim();
  const guestEmail = String(formData.get("guestEmail") ?? "").trim();
  const arrivalDate = String(formData.get("arrivalDate") ?? "");
  const departureDate = String(formData.get("departureDate") ?? "");

  if (!id || !propertyId || !guestDisplayName || !arrivalDate) {
    throw new Error("Reservation id, property, guest name, and arrival date are required.");
  }

  const { error } = await admin
    .from("reservations")
    .update({
      arrival_date: arrivalDate,
      departure_date: departureDate || null,
      guest_display_name: guestDisplayName,
      guest_email: guestEmail || null,
      property_id: propertyId,
    })
    .eq("id", id)
    .eq("organization_id", workspace.organizationId);

  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function deleteReservation(formData: FormData) {
  const { workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const id = String(formData.get("reservationId") ?? "");

  if (!id) throw new Error("Reservation id is required.");

  const { error } = await admin
    .from("reservations")
    .delete()
    .eq("id", id)
    .eq("organization_id", workspace.organizationId);

  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function approveCompliance(formData: FormData) {
  const { userId, workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const complianceId = String(formData.get("complianceId") ?? "");

  if (!complianceId) {
    throw new Error("Compliance id is required.");
  }

  const { error } = await admin
    .from("compliance_forms")
    .update({ approved_at: new Date().toISOString(), status: "approved" })
    .eq("id", complianceId)
    .eq("organization_id", workspace.organizationId);

  if (error) throw error;

  await admin.from("audit_logs").insert({
    actor_user_id: userId,
    entity_id: complianceId,
    entity_type: "compliance_form",
    event_type: "compliance.approved",
    organization_id: workspace.organizationId,
  });

  revalidatePath("/dashboard");
}

export async function markComplianceExported(formData: FormData) {
  const { userId, workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const complianceId = String(formData.get("complianceId") ?? "");

  if (!complianceId) throw new Error("Compliance id is required.");

  const { error } = await admin
    .from("compliance_forms")
    .update({ exported_at: new Date().toISOString(), status: "exported" })
    .eq("id", complianceId)
    .eq("organization_id", workspace.organizationId);

  if (error) throw error;

  await admin.from("audit_logs").insert({
    actor_user_id: userId,
    entity_id: complianceId,
    entity_type: "compliance_form",
    event_type: "compliance.exported_marked",
    organization_id: workspace.organizationId,
  });

  revalidatePath("/dashboard");
}

export async function resetCompliance(formData: FormData) {
  const { userId, workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const complianceId = String(formData.get("complianceId") ?? "");

  if (!complianceId) throw new Error("Compliance id is required.");

  const { error } = await admin
    .from("compliance_forms")
    .update({ approved_at: null, exported_at: null, status: "missing" })
    .eq("id", complianceId)
    .eq("organization_id", workspace.organizationId);

  if (error) throw error;

  await admin.from("audit_logs").insert({
    actor_user_id: userId,
    entity_id: complianceId,
    entity_type: "compliance_form",
    event_type: "compliance.reset",
    organization_id: workspace.organizationId,
  });

  revalidatePath("/dashboard");
}

export async function createKnowledgeDocument(formData: FormData) {
  const { workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const propertyId = String(formData.get("propertyId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const approved = formData.get("approved") === "on";

  if (!propertyId || !title || !body) {
    throw new Error("Property, title, and body are required.");
  }

  const { error } = await admin.from("knowledge_documents").insert({
    approved,
    body,
    organization_id: workspace.organizationId,
    property_id: propertyId,
    title,
  });

  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function updateKnowledgeDocument(formData: FormData) {
  const { workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const id = String(formData.get("knowledgeId") ?? "");
  const propertyId = String(formData.get("propertyId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!id || !propertyId || !title || !body) {
    throw new Error("Knowledge id, property, title, and body are required.");
  }

  const { error } = await admin
    .from("knowledge_documents")
    .update({ body, property_id: propertyId, title })
    .eq("id", id)
    .eq("organization_id", workspace.organizationId);

  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function deleteKnowledgeDocument(formData: FormData) {
  const { workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const id = String(formData.get("knowledgeId") ?? "");

  if (!id) throw new Error("Knowledge id is required.");

  const { error } = await admin
    .from("knowledge_documents")
    .delete()
    .eq("id", id)
    .eq("organization_id", workspace.organizationId);

  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function toggleKnowledgeApproval(formData: FormData) {
  const { workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const id = String(formData.get("knowledgeId") ?? "");
  const approved = formData.get("approved") === "true";

  if (!id) throw new Error("Knowledge id is required.");

  const { error } = await admin
    .from("knowledge_documents")
    .update({ approved })
    .eq("id", id)
    .eq("organization_id", workspace.organizationId);

  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function generateAiDraft(formData: FormData) {
  const { userId, workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const conversationId = String(formData.get("conversationId") ?? "");

  if (!conversationId) throw new Error("Conversation id is required.");

  const { data: conversation, error } = await admin
    .from("conversations")
    .select("id, property_id, guest_display_name, language, properties(name), messages(body, direction)")
    .eq("id", conversationId)
    .eq("organization_id", workspace.organizationId)
    .single();

  if (error) throw error;

  const inbound = conversation.messages?.find(
    (message: { body: string; direction: string }) => message.direction === "inbound",
  );

  if (!inbound || !conversation.property_id) {
    await markConversationNeedsReview(admin, workspace.organizationId, conversationId);
    revalidatePath("/dashboard");
    return;
  }

  const { data: documents, error: documentsError } = await admin
    .from("knowledge_documents")
    .select("id, title, body")
    .eq("organization_id", workspace.organizationId)
    .eq("property_id", conversation.property_id)
    .eq("approved", true);

  if (documentsError) throw documentsError;

  const property = Array.isArray(conversation.properties)
    ? conversation.properties[0]
    : conversation.properties;
  const draftPrompt = buildAiDraftPrompt({
    guestLanguage: conversation.language,
    guestMessage: inbound.body,
    knowledgeSources: documents ?? [],
    propertyName: property?.name ?? "Unknown property",
  });

  if (!draftPrompt.prompt) {
    await markConversationNeedsReview(
      admin,
      workspace.organizationId,
      conversationId,
      draftPrompt.blockedReason ?? "needs_human_review",
    );
    revalidatePath("/dashboard");
    return;
  }

  let draft: { model: string; text: string };

  try {
    draft = await createOpenAiDraft(draftPrompt.prompt);
  } catch (error) {
    await markConversationNeedsReview(
      admin,
      workspace.organizationId,
      conversationId,
      "openai_error",
    );
    await admin.from("audit_logs").insert({
      actor_user_id: userId,
      entity_id: conversationId,
      entity_type: "conversation",
      event_type: "ai_draft.failed",
      metadata: {
        message: error instanceof Error ? error.message : "Unknown OpenAI error",
        pii_sent_to_model: false,
      },
      organization_id: workspace.organizationId,
    });
    revalidatePath("/dashboard");
    return;
  }

  const sourceLabel = draftPrompt.sources.map((source) => source.title).join(", ");

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
    actor_user_id: userId,
    entity_id: conversationId,
    entity_type: "conversation",
    event_type: "ai_draft.generated",
    metadata: { model: draft.model, source_label: sourceLabel, pii_sent_to_model: false },
    organization_id: workspace.organizationId,
  });

  revalidatePath("/dashboard");
}

export async function approveAiDraft(formData: FormData) {
  const { userId, workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const conversationId = String(formData.get("conversationId") ?? "");

  if (!conversationId) throw new Error("Conversation id is required.");

  const now = new Date().toISOString();
  const { error } = await admin
    .from("conversations")
    .update({
      approval_status: "approved",
      approved_at: now,
      approved_by_user_id: userId,
      status: "resolved",
    })
    .eq("id", conversationId)
    .eq("organization_id", workspace.organizationId);

  if (error) throw error;

  await admin
    .from("messages")
    .update({
      approval_status: "approved",
      approved_at: now,
      approved_by_user_id: userId,
    })
    .eq("conversation_id", conversationId)
    .eq("organization_id", workspace.organizationId)
    .eq("direction", "ai_draft");

  await admin.from("audit_logs").insert({
    actor_user_id: userId,
    entity_id: conversationId,
    entity_type: "conversation",
    event_type: "ai_draft.approved_internal",
    metadata: { external_send: false },
    organization_id: workspace.organizationId,
  });

  revalidatePath("/dashboard");
}

export async function runAiAutomation(formData: FormData) {
  const { workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const conversationId = String(formData.get("conversationId") ?? "");

  if (!conversationId) throw new Error("Conversation id is required.");

  await processConversationNow({
    admin,
    conversationId,
    organizationId: workspace.organizationId,
  });

  revalidatePath("/dashboard");
}

async function markConversationNeedsReview(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
  conversationId: string,
  reason = "needs_human_review",
) {
  const { error } = await admin
    .from("conversations")
    .update({
      approval_status: reason,
      risk: "high",
      status: "needs_review",
    })
    .eq("id", conversationId)
    .eq("organization_id", organizationId);

  if (error) throw error;
}
