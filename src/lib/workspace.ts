import { createAdminClient } from "@/lib/supabase/admin";

export async function ensureWorkspace(userId: string, email?: string) {
  const admin = createAdminClient();

  const { data: existingMembership, error: membershipError } = await admin
    .from("memberships")
    .select("organization_id, organizations(name)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  if (existingMembership?.organization_id) {
    return {
      organizationId: existingMembership.organization_id as string,
      organizationName:
        (existingMembership.organizations as { name?: string } | null)?.name ??
        "HostOps Workspace",
    };
  }

  const workspaceName = email ? `${email.split("@")[0]} workspace` : "HostOps Workspace";
  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .insert({ name: workspaceName })
    .select("id, name")
    .single();

  if (organizationError) {
    throw organizationError;
  }

  const { error: insertMembershipError } = await admin.from("memberships").insert({
    organization_id: organization.id,
    role: "owner",
    user_id: userId,
  });

  if (insertMembershipError) {
    throw insertMembershipError;
  }

  return {
    organizationId: organization.id as string,
    organizationName: organization.name as string,
  };
}
