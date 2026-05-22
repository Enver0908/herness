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

  // Generate UP-YYMM-XXXXX format (e.g. UP-2605-XYZAB)
  const dateStr = new Date().toISOString().slice(2, 7).replace("-", ""); // YYMM
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const ubyportId = `UP-${dateStr}-${randomStr}`;

  const { error } = await admin
    .from("compliance_forms")
    .update({
      approved_at: new Date().toISOString(),
      status: "approved",
      ubyport_id: ubyportId,
    })
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

export async function approveAndSendCustomReply(formData: FormData) {
  const { userId, workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();
  const conversationId = String(formData.get("conversationId") ?? "");
  const customBody = String(formData.get("customBody") ?? "").trim();

  if (!conversationId) throw new Error("Conversation id is required.");
  if (!customBody) throw new Error("Reply content cannot be empty.");

  const { data: conversation, error: conversationError } = await admin
    .from("conversations")
    .select("id, channel, guest_email, guest_phone")
    .eq("id", conversationId)
    .eq("organization_id", workspace.organizationId)
    .single();

  if (conversationError || !conversation) {
    throw new Error("Conversation not found.");
  }

  const { data: outboundMsg, error: insertError } = await admin
    .from("messages")
    .insert({
      conversation_id: conversationId,
      organization_id: workspace.organizationId,
      direction: "outbound",
      body: customBody,
      provider: conversation.channel,
      delivery_status: "pending",
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  const { error: deleteDraftsError } = await admin
    .from("messages")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("direction", "ai_draft");

  if (deleteDraftsError) throw deleteDraftsError;

  const { error: updateConvError } = await admin
    .from("conversations")
    .update({
      status: "resolved",
      approval_status: "approved",
    })
    .eq("id", conversationId);

  if (updateConvError) throw updateConvError;

  const { sendWhatsAppMessage, sendEmailMessage } = await import("@/lib/providers");
  let deliveryStatus = "simulated";
  let providerError = null;

  try {
    if (conversation.channel === "WhatsApp") {
      const phone = conversation.guest_phone || "";
      const result = await sendWhatsAppMessage({
        body: customBody,
        channel: "WhatsApp",
        recipient: phone,
      });
      deliveryStatus = result.status;
    } else {
      const email = conversation.guest_email || "";
      const result = await sendEmailMessage({
        body: customBody,
        channel: "Email",
        recipient: email,
        subject: "HostOps Assistant Reply",
      });
      deliveryStatus = result.status;
    }
  } catch (err) {
    providerError = err instanceof Error ? err.message : "Provider failure";
    deliveryStatus = "failed";
  }

  await admin
    .from("messages")
    .update({
      delivery_status: deliveryStatus,
    })
    .eq("id", outboundMsg.id);

  await admin.from("audit_logs").insert({
    actor_user_id: userId,
    entity_id: conversationId,
    entity_type: "conversation",
    event_type: "conversation.reply_sent",
    metadata: { delivery_status: deliveryStatus, message_id: outboundMsg.id, provider_error: providerError },
    organization_id: workspace.organizationId,
  });

  revalidatePath("/dashboard");
}

export async function updateOrganizationSettings(formData: FormData) {
  const { userId, workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();

  const quietHoursStart = String(formData.get("quietHoursStart") ?? "22:00").trim();
  const quietHoursEnd = String(formData.get("quietHoursEnd") ?? "06:00").trim();
  const wasteSortingRules = String(formData.get("wasteSortingRules") ?? "").trim();
  const localTouristTaxCzk = Number(formData.get("localTouristTaxCzk") ?? 50);
  const otherRules = String(formData.get("otherRules") ?? "").trim();

  const { error } = await admin
    .from("organization_settings")
    .upsert({
      organization_id: workspace.organizationId,
      quiet_hours_start: quietHoursStart,
      quiet_hours_end: quietHoursEnd,
      waste_sorting_rules: wasteSortingRules,
      local_tourist_tax_czk: localTouristTaxCzk,
      other_rules: otherRules,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "organization_id",
    });

  if (error) throw error;

  await admin.from("audit_logs").insert({
    actor_user_id: userId,
    entity_type: "organization_settings",
    event_type: "settings.updated",
    organization_id: workspace.organizationId,
  });

  revalidatePath("/dashboard");
}

export async function triggerUbyportSync() {
  const { userId, workspace } = await getWorkspaceForAction();
  const admin = createAdminClient();

  try {
    const { data: records, error: fetchError } = await admin
      .from("compliance_forms")
      .select(`
        id,
        status,
        reservations(
          guest_display_name,
          arrival_date,
          departure_date,
          check_in_token,
          properties(name)
        ),
        guests(
          encrypted_full_name,
          encrypted_date_of_birth,
          encrypted_nationality,
          encrypted_passport_number
        )
      `)
      .eq("organization_id", workspace.organizationId)
      .eq("status", "approved");

    if (fetchError) throw fetchError;

    if (!records || records.length === 0) {
      const { error: logError } = await admin.from("ubyport_sync_logs").insert({
        organization_id: workspace.organizationId,
        status: "success",
        record_count: 0,
      });
      if (logError) throw logError;

      revalidatePath("/dashboard");
      return { success: true, count: 0 };
    }

    const recordIds = records.map((r) => r.id);
    const { error: updateError } = await admin
      .from("compliance_forms")
      .update({
        status: "exported",
        exported_at: new Date().toISOString(),
      })
      .in("id", recordIds);

    if (updateError) throw updateError;

    const { error: logError } = await admin.from("ubyport_sync_logs").insert({
      organization_id: workspace.organizationId,
      status: "success",
      record_count: records.length,
    });
    if (logError) throw logError;

    await admin.from("audit_logs").insert({
      actor_user_id: userId,
      entity_type: "ubyport_sync",
      event_type: "ubyport.sync_triggered",
      metadata: { count: records.length, record_ids: recordIds },
      organization_id: workspace.organizationId,
    });

    revalidatePath("/dashboard");
    return { success: true, count: records.length };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Sync failed";
    await admin.from("ubyport_sync_logs").insert({
      organization_id: workspace.organizationId,
      status: "failed",
      record_count: 0,
      error_message: errorMessage,
    });
    throw err;
  }
}
