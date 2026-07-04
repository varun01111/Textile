export const conversationTypes = [
  "in_person",
  "phone_call",
  "video_call",
  "uploaded_recording",
] as const;

export const processingStatuses = [
  "draft",
  "uploaded",
  "transcribing",
  "analyzing",
  "review_required",
  "approved",
  "exported",
  "failed",
  "deleted",
] as const;

export const conversationSourceLanguages = [
  "gujarati",
  "english",
  "auto",
] as const;
export const opportunityLevels = ["low", "medium", "high"] as const;
export const taskStatuses = ["pending", "completed"] as const;
export const followUpAutopilotStates = [
  "overdue",
  "due_today",
  "reminder_due",
  "upcoming",
  "unscheduled",
  "completed",
] as const;
export const trendCategories = [
  "color",
  "fabric",
  "design",
  "pattern_style",
  "market_trend",
  "concern",
  "opportunity",
  "machinery",
  "sourcing",
  "marketing_strategy",
  "sales_strategy",
] as const;

export type ConversationType = (typeof conversationTypes)[number];
export type ProcessingStatus = (typeof processingStatuses)[number];
export type ConversationSourceLanguage = (typeof conversationSourceLanguages)[number];
export type OpportunityLevel = (typeof opportunityLevels)[number];
export type TaskStatus = (typeof taskStatuses)[number];
export type FollowUpAutopilotState = (typeof followUpAutopilotStates)[number];
export type TrendCategory = (typeof trendCategories)[number];

export interface TranscriptSegment {
  speaker: string | null;
  startMs: number | null;
  endMs: number | null;
  text: string;
}

export interface AnalysisTaskDraft {
  task: string;
  dueDate: string | null;
}

export interface AiAnalysis {
  summary: string;
  importantBusinessPoints: string[];
  clientPreferences: string[];
  designIdeas: string[];
  fabricMentions: string[];
  colorMentions: string[];
  patternStyleMentions: string[];
  marketTrendInsights: string[];
  pricingDiscussion: string[];
  possibleOrders: string[];
  followUpTasks: AnalysisTaskDraft[];
  deadlines: string[];
  clientConcerns: string[];
  newOpportunities: string[];
  machineryOpportunities: string[];
  sourcingOpportunities: string[];
  marketingStrategySuggestions: string[];
  salesStrategySuggestions: string[];
  ignoredCasualTalk: string[];
  opportunityLevel: OpportunityLevel;
  nextAction: string;
}

export interface ConversationRecord {
  id: string;
  ownerId: string;
  clientName: string;
  meetingTitle: string;
  meetingDate: string;
  conversationType: ConversationType;
  consentAcknowledged: boolean;
  audioStoragePath: string | null;
  audioFileName: string | null;
  audioMimeType: string | null;
  audioSizeBytes: number | null;
  processingStatus: ProcessingStatus;
  approvedAt: string | null;
  exportedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptRecord {
  id: string;
  conversationId: string;
  fullTranscript: string;
  detectedLanguage: string | null;
  transcriptProvider: string | null;
  rawSegments: TranscriptSegment[];
  createdAt: string;
  updatedAt: string;
}

export interface AiAnalysisRecord {
  id: string;
  conversationId: string;
  analysis: AiAnalysis;
  summary: string;
  opportunityLevel: OpportunityLevel;
  nextAction: string;
  providerModel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpTaskRecord {
  id: string;
  conversationId: string;
  taskText: string;
  dueDate: string | null;
  status: TaskStatus;
  reminderAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpAutopilotTask extends FollowUpTaskRecord {
  clientName: string;
  meetingTitle: string;
  meetingDate: string;
  autopilotState: FollowUpAutopilotState;
  dueDateIso: string | null;
  reminderAtIso: string | null;
  sortAt: string;
  daysUntilDue: number | null;
}

export interface TrendMentionRecord {
  id: string;
  conversationId: string;
  category: TrendCategory;
  label: string;
  normalizedValue: string;
  mentionCount: number;
  sourceField: string;
  createdAt: string;
}

export interface GoogleSheetExportRecord {
  id: string;
  conversationId: string;
  spreadsheetId: string;
  sheetName: string;
  rowNumber: number | null;
  exportStatus: "success" | "failed";
  exportedAt: string | null;
  payload: string[];
  errorMessage: string | null;
  createdAt: string;
}

export interface ConversationDetail {
  conversation: ConversationRecord;
  transcript: TranscriptRecord | null;
  analysis: AiAnalysisRecord | null;
  followUpTasks: FollowUpTaskRecord[];
  exportRecord: GoogleSheetExportRecord | null;
}

export interface DashboardConversationCard {
  conversation: ConversationRecord;
  analysis: AiAnalysisRecord | null;
  followUpTasks: FollowUpTaskRecord[];
}

export interface DashboardFilters {
  clientName?: string;
  date?: string;
  color?: string;
  fabric?: string;
  trend?: string;
  opportunityLevel?: OpportunityLevel;
  pendingFollowUps?: boolean;
}

export interface TrendSummary {
  category: TrendCategory;
  label: string;
  normalizedValue: string;
  count: number;
}

export interface FollowUpAutopilotSummary {
  overdue: FollowUpAutopilotTask[];
  dueToday: FollowUpAutopilotTask[];
  reminderDue: FollowUpAutopilotTask[];
  upcoming: FollowUpAutopilotTask[];
  unscheduled: FollowUpAutopilotTask[];
  completedRecently: FollowUpAutopilotTask[];
  metrics: {
    overdueCount: number;
    dueTodayCount: number;
    reminderDueCount: number;
    upcomingCount: number;
    completedThisWeekCount: number;
  };
}
