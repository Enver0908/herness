import { isAppConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export type GuestCheckInContext =
  | { status: "setup_required" }
  | { status: "not_found" }
  | {
      status: "ready";
      guestName: string;
      propertyName: string;
      arrivalDate: string;
    };

export async function getGuestCheckInContext(token: string): Promise<GuestCheckInContext> {
  if (!isAppConfigured()) {
    return { status: "setup_required" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reservations")
    .select("guest_display_name, arrival_date, properties(name)")
    .eq("check_in_token", token)
    .gt("token_expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return { status: "not_found" };
  }

  return {
    arrivalDate: data.arrival_date as string,
    guestName: data.guest_display_name as string,
    propertyName:
      (data.properties as { name?: string } | null)?.name ?? "your Prague apartment",
    status: "ready",
  };
}
