import { randomUUID } from "node:crypto";
import { sendOutboundMessage } from "@/lib/providers";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

type ReservationRow = {
  id: string;
  check_in_token: string;
  guest_display_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  property_id: string;
};

type OperationTaskRow = {
  id: string;
  organization_id: string;
  reservation_id: string | null;
  task_type: string;
  reservations: ReservationRow | ReservationRow[] | null;
};

export async function ensureComplianceAndCheckInTasks(input: {
  admin: AdminClient;
  arrivalDate: string;
  organizationId: string;
  propertyId: string;
  reservationId: string;
}) {
  await input.admin.from("compliance_forms").upsert({
    organization_id: input.organizationId,
    reservation_id: input.reservationId,
    status: "missing",
  }, { onConflict: "reservation_id" });

  const dueAt = new Date(`${input.arrivalDate}T08:00:00.000Z`);
  await input.admin.from("operation_tasks").insert({
    due_at: new Date().toISOString(),
    metadata: { arrival_date: input.arrivalDate },
    organization_id: input.organizationId,
    property_id: input.propertyId,
    reservation_id: input.reservationId,
    task_type: "send_check_in_link",
  });

  await input.admin.from("operation_tasks").insert({
    due_at: dueAt.toISOString(),
    metadata: { arrival_date: input.arrivalDate },
    organization_id: input.organizationId,
    property_id: input.propertyId,
    reservation_id: input.reservationId,
    task_type: "check_in_reminder",
  });
}

export async function createOperationCase(input: {
  admin: AdminClient;
  caseType: string;
  conversationId: string;
  messageId: string;
  organizationId: string;
  propertyId?: string | null;
  recommendedAction?: string;
  reservationId?: string | null;
  risk: "low" | "medium" | "high";
  summary: string;
}) {
  const title = titleForCase(input.caseType);
  const { data, error } = await input.admin
    .from("operation_cases")
    .insert({
      case_type: input.caseType,
      conversation_id: input.conversationId,
      message_id: input.messageId,
      organization_id: input.organizationId,
      property_id: input.propertyId ?? null,
      recommended_action: input.recommendedAction ?? defaultActionForCase(input.caseType),
      reservation_id: input.reservationId ?? null,
      risk: input.risk,
      summary: input.summary,
      title,
    })
    .select("id")
    .single();

  if (error) throw error;

  await input.admin.from("audit_logs").insert({
    entity_id: data.id,
    entity_type: "operation_case",
    event_type: "operation_case.created",
    metadata: {
      case_type: input.caseType,
      conversation_id: input.conversationId,
      risk: input.risk,
    },
    organization_id: input.organizationId,
  });

  return data.id as string;
}

export async function processDueOperationTasks(limit = 10) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("operation_tasks")
    .select("id, organization_id, reservation_id, task_type, reservations(id, property_id, check_in_token, guest_display_name, guest_email, guest_phone)")
    .eq("status", "pending")
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  const results = [];
  for (const task of (data ?? []) as unknown as OperationTaskRow[]) {
    results.push(await processOperationTask(admin, task));
  }

  return results;
}

async function processOperationTask(admin: AdminClient, task: OperationTaskRow) {
  const reservation = Array.isArray(task.reservations) ? task.reservations[0] : task.reservations;

  if (!reservation) {
    await markTaskFailed(admin, task.id, "Reservation is missing.");
    return { error: "Reservation is missing.", taskId: task.id };
  }

  const recipient = reservation.guest_phone || reservation.guest_email;
  if (!recipient) {
    await markTaskFailed(admin, task.id, "Guest contact is missing.");
    return { error: "Guest contact is missing.", taskId: task.id };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const checkInUrl = `${appUrl}/guest/check-in/${reservation.check_in_token}`;
  const body = messageForTask(task.task_type, reservation.guest_display_name, checkInUrl);
  const channel = reservation.guest_phone ? "WhatsApp" : "Email";

  try {
    const delivery = await sendOutboundMessage({
      body,
      channel,
      recipient,
      subject: "Your Prague stay check-in",
    });

    await admin
      .from("operation_tasks")
      .update({
        completed_at: new Date().toISOString(),
        delivery_status: delivery.status,
        last_error: null,
        status: "done",
      })
      .eq("id", task.id);

    await admin.from("audit_logs").insert({
      entity_id: task.id,
      entity_type: "operation_task",
      event_type: "operation_task.completed",
      metadata: {
        provider: delivery.provider,
        provider_message_id: delivery.providerMessageId,
        task_type: task.task_type,
      },
      organization_id: task.organization_id,
    });

    return { deliveryStatus: delivery.status, taskId: task.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown operation task error";
    await markTaskFailed(admin, task.id, message);
    return { error: message, taskId: task.id };
  }
}

async function markTaskFailed(admin: AdminClient, taskId: string, message: string) {
  await admin
    .from("operation_tasks")
    .update({ delivery_status: "failed", last_error: message, status: "failed" })
    .eq("id", taskId);
}

function messageForTask(taskType: string, guestName: string, checkInUrl: string) {
  if (taskType === "check_in_reminder") {
    return `Hi ${guestName}, a quick reminder to complete your secure check-in before arrival: ${checkInUrl}`;
  }

  return `Hi ${guestName}, please complete your secure check-in for your Prague stay here: ${checkInUrl}`;
}

function titleForCase(caseType: string) {
  if (caseType.includes("refund")) return "Refund or compensation review";
  if (caseType.includes("privacy")) return "Privacy or identity review";
  if (caseType.includes("emergency")) return "Emergency or safety review";
  if (caseType.includes("missing")) return "Missing approved source";
  return "Guest message review";
}

function defaultActionForCase(caseType: string) {
  if (caseType.includes("refund")) return "Review booking policy and message history before offering any refund.";
  if (caseType.includes("privacy")) return "Do not request or expose identity data in chat; move the guest to the secure form.";
  if (caseType.includes("emergency")) return "Escalate to the manager immediately and confirm guest safety.";
  if (caseType.includes("missing")) return "Add or approve property knowledge before rerunning automation.";
  return "Review the conversation and respond from the dashboard.";
}

export function createReservationToken() {
  return randomUUID();
}
