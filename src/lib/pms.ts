import { createReservationToken, ensureComplianceAndCheckInTasks } from "@/lib/operations";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePilotWorkspace, ingestInboundMessage } from "./inbound";

export type PmsReservationEvent = {
  arrivalDate: string;
  channel?: string;
  departureDate?: string | null;
  externalUrl?: string | null;
  guestEmail?: string | null;
  guestName: string;
  guestPhone?: string | null;
  provider: string;
  providerPropertyId?: string | null;
  providerReservationId: string;
  reservationStatus?: string;
  specialRequests?: string | null;
};

export type PmsMessageEvent = {
  body: string;
  guestEmail?: string | null;
  guestName: string;
  guestPhone?: string | null;
  language?: string;
  provider: string;
  providerMessageId: string;
  providerReservationId?: string | null;
  providerThreadId?: string | null;
  subject?: string | null;
};

export async function ingestPmsReservation(input: PmsReservationEvent) {
  const admin = createAdminClient();
  const workspace = await resolvePilotWorkspace(admin);
  const propertyId = workspace.propertyId;

  if (!propertyId) {
    throw new Error("No property is available for PMS reservation ingestion.");
  }

  const existing = await findReservation(admin, workspace.organizationId, input.provider, input.providerReservationId);
  const token = existing?.check_in_token ?? createReservationToken();
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

  const payload = {
    arrival_date: input.arrivalDate,
    channel: input.channel ?? "Airbnb",
    check_in_token: token,
    departure_date: input.departureDate || null,
    external_url: input.externalUrl ?? null,
    guest_display_name: input.guestName,
    guest_email: input.guestEmail ?? null,
    guest_phone: input.guestPhone ?? null,
    organization_id: workspace.organizationId,
    property_id: propertyId,
    provider: input.provider,
    provider_reservation_id: input.providerReservationId,
    reservation_status: input.reservationStatus ?? "confirmed",
    special_requests: input.specialRequests ?? null,
    token_expires_at: tokenExpiresAt.toISOString(),
  };

  const { data: reservation, error } = await admin
    .from("reservations")
    .upsert(payload, { onConflict: "organization_id,provider,provider_reservation_id" })
    .select("id")
    .single();

  if (error) throw error;

  if (!existing) {
    await ensureComplianceAndCheckInTasks({
      admin,
      arrivalDate: input.arrivalDate,
      organizationId: workspace.organizationId,
      propertyId,
      reservationId: reservation.id as string,
    });
  }

  await admin.from("audit_logs").insert({
    entity_id: reservation.id,
    entity_type: "reservation",
    event_type: existing ? "reservation.pms_updated" : "reservation.pms_created",
    metadata: {
      provider: input.provider,
      provider_reservation_id: input.providerReservationId,
    },
    organization_id: workspace.organizationId,
  });

  return {
    created: !existing,
    reservationId: reservation.id as string,
  };
}

export async function ingestPmsMessage(input: PmsMessageEvent) {
  const admin = createAdminClient();
  const workspace = await resolvePilotWorkspace(admin);
  const reservation = input.providerReservationId
    ? await findReservation(admin, workspace.organizationId, input.provider, input.providerReservationId)
    : null;

  return ingestInboundMessage({
    body: input.body,
    channel: input.guestPhone ? "WhatsApp" : "Email",
    guestEmail: input.guestEmail ?? reservation?.guest_email ?? null,
    guestName: input.guestName,
    guestPhone: input.guestPhone ?? reservation?.guest_phone ?? null,
    language: input.language,
    propertyId: reservation?.property_id ?? workspace.propertyId,
    provider: input.provider,
    providerMessageId: input.providerMessageId,
    providerThreadId: input.providerThreadId ?? input.providerReservationId ?? null,
    reservationId: reservation?.id ?? null,
    subject: input.subject,
  });
}

async function findReservation(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
  provider: string,
  providerReservationId: string,
) {
  const { data, error } = await admin
    .from("reservations")
    .select("id, property_id, check_in_token, guest_email, guest_phone")
    .eq("organization_id", organizationId)
    .eq("provider", provider)
    .eq("provider_reservation_id", providerReservationId)
    .maybeSingle();

  if (error) throw error;
  return data as {
    id: string;
    property_id: string;
    check_in_token: string;
    guest_email: string | null;
    guest_phone: string | null;
  } | null;
}
