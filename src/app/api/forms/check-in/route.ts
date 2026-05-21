import { NextResponse } from "next/server";
import { encryptPii } from "@/lib/crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const requiredFields = [
  "token",
  "fullName",
  "dateOfBirth",
  "nationality",
  "passportNumber",
  "arrivalDate",
];

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, string | undefined>;
  const missingFields = requiredFields.filter((field) => !body[field]?.trim());

  if (missingFields.length > 0) {
    return NextResponse.json({ error: "missing_fields", missingFields }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: reservation, error: reservationError } = await admin
    .from("reservations")
    .select("id, organization_id, token_expires_at")
    .eq("check_in_token", body.token)
    .gt("token_expires_at", new Date().toISOString())
    .maybeSingle();

  if (reservationError) {
    throw reservationError;
  }

  if (!reservation) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 404 });
  }

  const { data: guest, error: guestError } = await admin
    .from("guests")
    .insert({
      encrypted_date_of_birth: encryptPii(body.dateOfBirth ?? ""),
      encrypted_full_name: encryptPii(body.fullName ?? ""),
      encrypted_nationality: encryptPii(body.nationality ?? ""),
      encrypted_passport_number: encryptPii(body.passportNumber ?? ""),
      organization_id: reservation.organization_id,
      receipt_email: body.email?.trim() || null,
      reservation_id: reservation.id,
    })
    .select("id")
    .single();

  if (guestError) {
    throw guestError;
  }

  const { error: complianceError } = await admin
    .from("compliance_forms")
    .upsert(
      {
        guest_id: guest.id,
        organization_id: reservation.organization_id,
        reservation_id: reservation.id,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "reservation_id" },
    );

  if (complianceError) {
    throw complianceError;
  }

  await admin.from("audit_logs").insert({
    entity_id: guest.id,
    entity_type: "guest",
    event_type: "guest_check_in.submitted",
    metadata: { pii_sent_to_model: false },
    organization_id: reservation.organization_id,
  });

  return NextResponse.json({
    status: "submitted",
    encryptedAtRest: true,
    piiSentToModel: false,
  });
}
