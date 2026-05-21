import { cookies, headers } from "next/headers";
import {
  HOSTOPS_SESSION_COOKIE,
  readHostopsSessionCookie,
} from "@/lib/auth/session-cookie";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { one } from "@/lib/supabase/relations";
import { ensureWorkspace } from "@/lib/workspace";
import type {
  ComplianceRecord,
  Conversation,
  DashboardData,
  KnowledgeDocument,
  Metric,
  OperationCase,
  OperationTask,
  Property,
  Reservation,
} from "./types";

type PropertyRow = {
  id: string;
  name: string;
  area: string;
  address: string;
  channel: string;
  knowledge_health: number;
};

type ReservationRow = {
  id: string;
  property_id: string;
  guest_display_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  arrival_date: string;
  channel: string;
  departure_date: string | null;
  external_url: string | null;
  check_in_token: string;
  provider: string | null;
  reservation_status: string;
  properties?: PropertyRelation | PropertyRelation[] | null;
};

type ComplianceRow = {
  id: string;
  status: "missing" | "submitted" | "approved" | "exported";
  reservations: ReservationRelation | ReservationRelation[] | null;
};

type ConversationRow = {
  id: string;
  guest_display_name: string;
  channel: "WhatsApp" | "Email";
  language: string;
  status: "auto_sent" | "needs_review" | "draft" | "resolved";
  risk: "low" | "medium" | "high";
  source_label: string | null;
  minutes_saved: number;
  approval_status?: string;
  properties: PropertyRelation | PropertyRelation[] | null;
  messages: {
    body: string;
    direction: string;
  }[];
};

type AiDecisionRow = {
  can_auto_send: boolean;
  category: string;
  confidence: number;
  conversation_id: string;
  created_at: string;
  delivery_status: string;
  escalation_reason: string | null;
  provider: string | null;
  reason: string;
  risk: "low" | "medium" | "high";
  source_label: string | null;
};

type ReservationRelation = {
  guest_display_name: string;
  arrival_date: string;
  check_in_token: string;
  properties: PropertyRelation | PropertyRelation[] | null;
};

type PropertyRelation = {
  name: string;
};

type KnowledgeRow = {
  id: string;
  property_id: string;
  title: string;
  body: string;
  approved: boolean;
  properties: PropertyRelation | PropertyRelation[] | null;
};

type OperationCaseRow = {
  id: string;
  case_type: string;
  created_at: string;
  recommended_action: string | null;
  risk: "low" | "medium" | "high";
  status: string;
  summary: string;
  title: string;
  conversations: { guest_display_name: string } | { guest_display_name: string }[] | null;
  properties: PropertyRelation | PropertyRelation[] | null;
};

type OperationTaskRow = {
  id: string;
  delivery_status: string;
  due_at: string | null;
  last_error: string | null;
  status: string;
  task_type: string;
  reservations: ReservationRelation | ReservationRelation[] | null;
};

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  let authUserId = user?.id;
  let authUserEmail = user?.email;
  let db = supabase;

  if (userError || !authUserId) {
    const requestHeaders = await headers();
    const signedSession =
      (await cookies()).get(HOSTOPS_SESSION_COOKIE)?.value ||
      getCookieValue(requestHeaders.get("cookie"), HOSTOPS_SESSION_COOKIE);
    const fallbackSession = readHostopsSessionCookie(signedSession);

    if (!fallbackSession) {
      throw new Error("Unauthorized");
    }

    authUserId = fallbackSession.userId;
    authUserEmail = fallbackSession.email;
    db = createAdminClient();
  }

  const workspace = await ensureWorkspace(authUserId, authUserEmail);

  const [propertiesResult, reservationsResult, complianceResult, conversationsResult, knowledgeResult, casesResult, tasksResult] =
    await Promise.all([
      db
        .from("properties")
        .select("id, name, area, address, channel, knowledge_health")
        .eq("organization_id", workspace.organizationId)
        .order("created_at", { ascending: true }),
      db
        .from("reservations")
        .select("id, property_id, guest_display_name, guest_email, guest_phone, arrival_date, channel, departure_date, external_url, check_in_token, provider, reservation_status, properties(name)")
        .eq("organization_id", workspace.organizationId),
      db
        .from("compliance_forms")
        .select("id, status, reservations(guest_display_name, arrival_date, check_in_token, properties(name))")
        .eq("organization_id", workspace.organizationId)
        .order("created_at", { ascending: false }),
      db
        .from("conversations")
        .select(
          "id, guest_display_name, channel, language, status, risk, source_label, minutes_saved, approval_status, properties(name), messages(body, direction)",
        )
        .eq("organization_id", workspace.organizationId)
        .order("updated_at", { ascending: false }),
      db
        .from("knowledge_documents")
        .select("id, property_id, title, body, approved, properties(name)")
        .eq("organization_id", workspace.organizationId)
        .order("created_at", { ascending: false }),
      db
        .from("operation_cases")
        .select("id, case_type, status, risk, title, summary, recommended_action, created_at, conversations(guest_display_name), properties(name)")
        .eq("organization_id", workspace.organizationId)
        .order("created_at", { ascending: false })
        .limit(20),
      db
        .from("operation_tasks")
        .select("id, task_type, status, due_at, delivery_status, last_error, reservations(guest_display_name, arrival_date, check_in_token, properties(name))")
        .eq("organization_id", workspace.organizationId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (propertiesResult.error) throw propertiesResult.error;
  if (reservationsResult.error) throw reservationsResult.error;
  if (complianceResult.error) throw complianceResult.error;
  if (conversationsResult.error) throw conversationsResult.error;
  if (knowledgeResult.error) throw knowledgeResult.error;
  if (casesResult.error) throw casesResult.error;
  if (tasksResult.error) throw tasksResult.error;

  const reservations = (reservationsResult.data ?? []) as ReservationRow[];
  const reservationItems = reservations.map((reservation): Reservation => {
    const property = one(reservation.properties);

    return {
      arrivalDate: reservation.arrival_date,
      checkInToken: reservation.check_in_token,
      departureDate: reservation.departure_date ?? undefined,
      externalUrl: reservation.external_url ?? undefined,
      guestEmail: reservation.guest_email ?? undefined,
      guestPhone: reservation.guest_phone ?? undefined,
      guestName: reservation.guest_display_name,
      id: reservation.id,
      channel: reservation.channel,
      provider: reservation.provider ?? undefined,
      propertyId: reservation.property_id,
      propertyName: property?.name ?? "Unknown property",
      reservationStatus: reservation.reservation_status,
    };
  });

  const properties = ((propertiesResult.data ?? []) as PropertyRow[]).map(
    (property): Property => ({
      activeReservations: reservations.filter(
        (reservation) => reservation.property_id === property.id,
      ).length,
      address: property.address,
      area: property.area,
      channel: property.channel as Property["channel"],
      id: property.id,
      knowledgeHealth: property.knowledge_health,
      name: property.name,
    }),
  );

  const complianceRecords = ((complianceResult.data ?? []) as unknown as ComplianceRow[]).map(
    (record): ComplianceRecord => {
      const reservation = one(record.reservations);
      const property = one(reservation?.properties);

      return {
      arrivalDate: reservation?.arrival_date ?? "Unknown",
      checkInToken: reservation?.check_in_token,
      guestName: reservation?.guest_display_name ?? "Unknown guest",
      id: record.id,
      missingFields: record.status === "missing" ? ["Check-in form"] : [],
      nationality: "Hidden",
      propertyName: property?.name ?? "Unknown property",
      status: record.status,
      };
    },
  );

  const conversationRows = (conversationsResult.data ?? []) as unknown as ConversationRow[];
  const conversationIds = conversationRows.map((conversation) => conversation.id);
  const { data: decisionRows, error: decisionError } = conversationIds.length > 0
    ? await db
        .from("ai_decisions")
        .select("conversation_id, category, risk, can_auto_send, confidence, reason, escalation_reason, source_label, provider, delivery_status, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (decisionError) throw decisionError;

  const decisionHistoryByConversation = new Map<string, AiDecisionRow[]>();
  for (const decision of (decisionRows ?? []) as AiDecisionRow[]) {
    const history = decisionHistoryByConversation.get(decision.conversation_id) ?? [];
    if (history.length < 3) history.push(decision);
    decisionHistoryByConversation.set(decision.conversation_id, history);
  }

  const conversations = conversationRows.map(
    (conversation): Conversation => {
      const property = one(conversation.properties);
      const inbound = conversation.messages.find((message) => message.direction === "inbound");
      const draft = conversation.messages.find((message) => message.direction === "ai_draft");
      const decisionHistory = decisionHistoryByConversation.get(conversation.id) ?? [];
      const [decision] = decisionHistory;

      return {
        aiReply: draft?.body ?? "No AI draft yet.",
        channel: conversation.channel,
        guestName: conversation.guest_display_name,
        id: conversation.id,
        language: conversation.language,
        lastMessage: inbound?.body ?? "No message yet.",
        minutesSaved: conversation.minutes_saved,
        approvalStatus: conversation.approval_status,
        propertyName: property?.name ?? "Unknown property",
        risk: conversation.risk,
        source: conversation.source_label ?? "No source",
        status: conversation.status,
        aiDecision: decision
          ? {
              canAutoSend: decision.can_auto_send,
              category: decision.category,
              confidence: decision.confidence,
              createdAt: decision.created_at,
              deliveryStatus: decision.delivery_status,
              escalationReason: decision.escalation_reason ?? undefined,
              provider: decision.provider ?? undefined,
              reason: decision.reason,
              risk: decision.risk,
              sourceLabel: decision.source_label ?? undefined,
            }
          : undefined,
        aiDecisionHistory: decisionHistory.map((item) => ({
          canAutoSend: item.can_auto_send,
          category: item.category,
          confidence: item.confidence,
          createdAt: item.created_at,
          deliveryStatus: item.delivery_status,
          escalationReason: item.escalation_reason ?? undefined,
          provider: item.provider ?? undefined,
          reason: item.reason,
          risk: item.risk,
          sourceLabel: item.source_label ?? undefined,
        })),
      };
    },
  );

  const knowledgeDocuments = ((knowledgeResult.data ?? []) as unknown as KnowledgeRow[]).map(
    (document): KnowledgeDocument => {
      const property = one(document.properties);

      return {
        approved: document.approved,
        body: document.body,
        id: document.id,
        propertyId: document.property_id,
        propertyName: property?.name ?? "Unknown property",
        title: document.title,
      };
    },
  );

  const operationCases = ((casesResult.data ?? []) as unknown as OperationCaseRow[]).map(
    (item): OperationCase => {
      const property = one(item.properties);
      const conversation = one(item.conversations);

      return {
        caseType: item.case_type,
        createdAt: item.created_at,
        guestName: conversation?.guest_display_name ?? "Unknown guest",
        id: item.id,
        propertyName: property?.name ?? "Unknown property",
        recommendedAction: item.recommended_action ?? undefined,
        risk: item.risk,
        status: item.status,
        summary: item.summary,
        title: item.title,
      };
    },
  );

  const operationTasks = ((tasksResult.data ?? []) as unknown as OperationTaskRow[]).map(
    (item): OperationTask => {
      const reservation = one(item.reservations);
      const property = one(reservation?.properties);

      return {
        deliveryStatus: item.delivery_status,
        dueAt: item.due_at ?? undefined,
        guestName: reservation?.guest_display_name ?? "Unknown guest",
        id: item.id,
        lastError: item.last_error ?? undefined,
        propertyName: property?.name ?? "Unknown property",
        status: item.status,
        taskType: item.task_type,
      };
    },
  );

  const autoResolved = conversations.filter(
    (conversation) => conversation.status === "auto_sent",
  ).length;
  const needsReview = conversations.filter(
    (conversation) => conversation.status === "needs_review",
  ).length + operationCases.filter((item) => item.status === "open").length;
  const ready = complianceRecords.filter((record) => record.status === "approved").length;
  const hoursSaved = conversations.reduce(
    (total, conversation) => total + conversation.minutesSaved,
    0,
  ) / 60;

  const metrics: Metric[] = [
    {
      detail: "Calculated from auto-resolved messages.",
      label: "Hours saved this week",
      value: hoursSaved.toFixed(1),
    },
    {
      detail: "Low-risk answers grounded in property knowledge.",
      label: "Auto-resolved messages",
      value: String(autoResolved),
    },
    {
      detail: "Guest records approved for Ubyport export.",
      label: "Compliance ready",
      value: String(ready),
    },
    {
      detail: "Refunds, complaints, emergencies, or missing context.",
      label: "Needs human review",
      value: String(needsReview),
    },
  ];

  return {
    complianceRecords,
    conversations,
    knowledgeDocuments,
    metrics,
    operationCases,
    operationTasks,
    organizationName: workspace.organizationName,
    properties,
    reservations: reservationItems,
  };
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;

  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.startsWith(`${name}=`))
    .map((item) => item.slice(name.length + 1))
    .find(Boolean);

  return cookie ? decodeURIComponent(cookie) : undefined;
}
