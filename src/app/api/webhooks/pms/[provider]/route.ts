import { NextResponse } from "next/server";
import { ingestPmsMessage, ingestPmsReservation } from "@/lib/pms";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const secret = request.headers.get("x-hostops-webhook-secret");
  if (process.env.PMS_WEBHOOK_SECRET && secret !== process.env.PMS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { provider } = await context.params;
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventType = String(payload.event_type ?? payload.eventType ?? "");

  if (eventType === "reservation.created" || eventType === "reservation.updated") {
    const reservation = normalizeReservationPayload(provider, payload);
    const result = await ingestPmsReservation(reservation);
    return NextResponse.json({ eventType, provider, received: true, result });
  }

  if (eventType === "message.created") {
    const message = normalizeMessagePayload(provider, payload);
    const result = await ingestPmsMessage(message);
    return NextResponse.json({ eventType, provider, queuedForRiskGate: result.queued, received: true, result });
  }

  return NextResponse.json({ error: "unsupported_event_type" }, { status: 400 });
}

function normalizeReservationPayload(provider: string, payload: Record<string, unknown>) {
  const reservation = readObject(payload.reservation) ?? payload;
  const providerReservationId = readString(reservation.id) ?? readString(reservation.provider_reservation_id);
  const guest = readObject(reservation.guest);
  const arrivalDate = readString(reservation.arrival_date) ?? readString(reservation.arrivalDate);

  if (!providerReservationId || !arrivalDate) {
    throw new Error("PMS reservation payload is missing id or arrival date.");
  }

  return {
    arrivalDate,
    channel: readString(reservation.channel),
    departureDate: readString(reservation.departure_date) ?? readString(reservation.departureDate),
    externalUrl: readString(reservation.external_url) ?? readString(reservation.externalUrl),
    guestEmail: readString(reservation.guest_email) ?? readString(guest?.email),
    guestName: readString(reservation.guest_name) ?? readString(guest?.name) ?? "Guest",
    guestPhone: readString(reservation.guest_phone) ?? readString(guest?.phone),
    provider,
    providerReservationId,
    reservationStatus: readString(reservation.status),
    specialRequests: readString(reservation.special_requests) ?? readString(reservation.specialRequests),
  };
}

function normalizeMessagePayload(provider: string, payload: Record<string, unknown>) {
  const message = readObject(payload.message) ?? payload;
  const guest = readObject(message.guest);
  const body = readString(message.body) ?? readString(message.text);
  const providerMessageId = readString(message.id) ?? readString(message.provider_message_id);

  if (!body || !providerMessageId) {
    throw new Error("PMS message payload is missing body or id.");
  }

  return {
    body,
    guestEmail: readString(message.guest_email) ?? readString(guest?.email),
    guestName: readString(message.guest_name) ?? readString(guest?.name) ?? "Guest",
    guestPhone: readString(message.guest_phone) ?? readString(guest?.phone),
    language: readString(message.language),
    provider,
    providerMessageId,
    providerReservationId: readString(message.reservation_id) ?? readString(message.provider_reservation_id),
    providerThreadId: readString(message.thread_id) ?? readString(message.provider_thread_id),
    subject: readString(message.subject),
  };
}

function readObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
