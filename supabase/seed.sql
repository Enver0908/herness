-- Replace the UUID below with the Supabase auth user id for your pilot admin.
-- Then run this file after 0001_initial_schema.sql.
do $$
declare
  admin_user uuid := '00000000-0000-0000-0000-000000000000';
  org uuid;
  p1 uuid;
  p2 uuid;
  p3 uuid;
  r1 uuid;
  r2 uuid;
  r3 uuid;
begin
  insert into public.organizations (name) values ('Demo Prague Host Co') returning id into org;
  insert into public.memberships (organization_id, user_id, role) values (org, admin_user, 'owner');

  insert into public.properties (organization_id, name, area, address, channel, knowledge_health)
  values (org, 'Old Town Loft 2B', 'Prague 1', 'Dlouha 18, Praha 1', 'Airbnb', 94)
  returning id into p1;

  insert into public.properties (organization_id, name, area, address, channel, knowledge_health)
  values (org, 'Karlin Garden Studio', 'Karlin', 'Krizikova 42, Praha 8', 'Booking', 88)
  returning id into p2;

  insert into public.properties (organization_id, name, area, address, channel, knowledge_health)
  values (org, 'Vinohrady Family Flat', 'Prague 2', 'Korunni 61, Praha 2', 'Direct', 79)
  returning id into p3;

  insert into public.reservations (organization_id, property_id, guest_display_name, guest_email, arrival_date, departure_date, check_in_token, token_expires_at)
  values (org, p1, 'Maria Santos', 'maria@example.com', '2026-06-04', '2026-06-08', 'demo-token-maria', now() + interval '30 days')
  returning id into r1;

  insert into public.reservations (organization_id, property_id, guest_display_name, guest_email, arrival_date, departure_date, check_in_token, token_expires_at)
  values (org, p2, 'Jonas Meyer', 'jonas@example.com', '2026-06-06', '2026-06-10', 'demo-token-jonas', now() + interval '30 days')
  returning id into r2;

  insert into public.reservations (organization_id, property_id, guest_display_name, guest_email, arrival_date, departure_date, check_in_token, token_expires_at)
  values (org, p3, 'Olena Koval', 'olena@example.com', '2026-06-08', '2026-06-11', 'demo-token-olena', now() + interval '30 days')
  returning id into r3;

  insert into public.compliance_forms (organization_id, reservation_id, status, submitted_at, approved_at)
  values
    (org, r1, 'approved', now(), now()),
    (org, r2, 'missing', null, null),
    (org, r3, 'submitted', now(), null);
end $$;
