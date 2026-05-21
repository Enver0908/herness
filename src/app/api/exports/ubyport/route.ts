import { NextResponse } from "next/server";
import { decryptPii } from "@/lib/crypto";
import { buildComplianceCsv } from "@/lib/export";
import { createAdminClient } from "@/lib/supabase/admin";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";
import { ensureWorkspace } from "@/lib/workspace";

type ExportRow = {
  id: string;
  reservations: ReservationRelation | ReservationRelation[] | null;
  guests: GuestRelation | GuestRelation[] | null;
};

type ReservationRelation = {
  guest_display_name: string;
  arrival_date: string;
  properties: PropertyRelation | PropertyRelation[] | null;
};

type PropertyRelation = {
  name: string;
};

type GuestRelation = {
  encrypted_nationality: string;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const workspace = await ensureWorkspace(user.id, user.email);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("compliance_forms")
    .select(
      "id, reservations(guest_display_name, arrival_date, properties(name)), guests(encrypted_nationality)",
    )
    .eq("organization_id", workspace.organizationId)
    .eq("status", "approved");

  if (error) {
    throw error;
  }

  const rows = ((data ?? []) as unknown as ExportRow[]).map((record) => {
    const reservation = one(record.reservations);
    const property = one(reservation?.properties);
    const guest = one(record.guests);

    return {
      arrivalDate: reservation?.arrival_date ?? "",
      guestName: reservation?.guest_display_name ?? "",
      nationality: guest?.encrypted_nationality
      ? decryptPii(guest.encrypted_nationality)
      : "",
      propertyName: property?.name ?? "",
    };
  });

  await admin.from("audit_logs").insert({
    actor_user_id: user.id,
    entity_type: "compliance_export",
    event_type: "compliance.exported",
    metadata: { row_count: rows.length },
    organization_id: workspace.organizationId,
  });

  return new Response(buildComplianceCsv(rows), {
    headers: {
      "content-disposition": "attachment; filename=ubyport-export.csv",
      "content-type": "text/csv; charset=utf-8",
    },
  });
}

export async function POST() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
