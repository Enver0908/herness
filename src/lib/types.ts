export type RiskLevel = "low" | "medium" | "high";

export type MessageStatus = "auto_sent" | "needs_review" | "draft" | "resolved";

export type ComplianceStatus = "missing" | "submitted" | "approved" | "exported";

export type Property = {
  id: string;
  name: string;
  area: string;
  address: string;
  channel: "Airbnb" | "Booking" | "Direct";
  activeReservations: number;
  knowledgeHealth: number;
};

export type Conversation = {
  id: string;
  guestName: string;
  propertyName: string;
  channel: "WhatsApp" | "Email";
  language: string;
  lastMessage: string;
  aiReply: string;
  status: MessageStatus;
  risk: RiskLevel;
  source: string;
  minutesSaved: number;
  approvalStatus?: string;
  aiDecision?: AiDecisionSummary;
  aiDecisionHistory: AiDecisionSummary[];
};

export type AiDecisionSummary = {
  canAutoSend: boolean;
  category: string;
  confidence: number;
  createdAt: string;
  deliveryStatus: string;
  escalationReason?: string;
  provider?: string;
  reason: string;
  risk: RiskLevel;
  sourceLabel?: string;
};

export type ComplianceRecord = {
  id: string;
  guestName: string;
  propertyName: string;
  arrivalDate: string;
  nationality: string;
  status: ComplianceStatus;
  missingFields: string[];
  checkInToken?: string;
};

export type Metric = {
  label: string;
  value: string;
  detail: string;
};

export type DashboardData = {
  organizationName: string;
  metrics: Metric[];
  properties: Property[];
  reservations: Reservation[];
  conversations: Conversation[];
  complianceRecords: ComplianceRecord[];
  operationCases: OperationCase[];
  operationTasks: OperationTask[];
  knowledgeDocuments: KnowledgeDocument[];
};

export type ComplianceExportRow = {
  guestName: string;
  propertyName: string;
  arrivalDate: string;
  departureDate?: string;
  nationality: string;
  dateOfBirth?: string;
  passportNumber?: string;
};

export type Reservation = {
  id: string;
  propertyId: string;
  propertyName: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  arrivalDate: string;
  channel: string;
  departureDate?: string;
  externalUrl?: string;
  checkInToken: string;
  provider?: string;
  reservationStatus: string;
};

export type KnowledgeDocument = {
  id: string;
  propertyId: string;
  propertyName: string;
  title: string;
  body: string;
  approved: boolean;
};

export type OperationCase = {
  id: string;
  caseType: string;
  createdAt: string;
  guestName: string;
  propertyName: string;
  recommendedAction?: string;
  risk: RiskLevel;
  status: string;
  summary: string;
  title: string;
};

export type OperationTask = {
  id: string;
  deliveryStatus: string;
  dueAt?: string;
  guestName: string;
  lastError?: string;
  propertyName: string;
  status: string;
  taskType: string;
};
