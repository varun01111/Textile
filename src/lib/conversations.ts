import type { SupabaseClient } from "@supabase/supabase-js";

import { getAppUrl, getSupabaseStorageEnv } from "@/lib/env";
import {
  applySnoozeWindow,
  buildDefaultReminderAt,
  decorateAutopilotTask,
  normalizeDateInput,
  normalizeReminderInput,
  summarizeAutopilotTasks,
} from "@/lib/follow-up-autopilot";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildFollowUpTasks } from "@/lib/transforms/follow-up-tasks";
import { buildConversationSheetRow } from "@/lib/transforms/google-sheet-row";
import { buildTrendMentions } from "@/lib/transforms/trend-normalization";
import type {
  AiAnalysis,
  AiAnalysisRecord,
  ConversationDetail,
  ConversationRecord,
  ConversationSourceLanguage,
  FollowUpAutopilotSummary,
  DashboardConversationCard,
  DashboardFilters,
  FollowUpTaskRecord,
  GoogleSheetExportRecord,
  TranscriptRecord,
  TrendSummary,
} from "@/lib/types";
import { safeFileName } from "@/lib/utils";
import { normalizeMimeType } from "@/lib/validation/conversation";
import { appendConversationRow } from "@/lib/vendors/google-sheets";

type CaptureConversationInput = {
  clientName: string;
  meetingTitle: string;
  meetingDate: string;
  conversationType: ConversationRecord["conversationType"];
  sourceLanguage?: ConversationSourceLanguage;
  consentAcknowledged: boolean;
};

type ConversationDbClient = SupabaseClient;

async function getConversationClient(client?: ConversationDbClient) {
  if (client) {
    return client;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured yet.");
  }

  return supabase;
}

function mapConversation(row: Record<string, unknown>): ConversationRecord {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    clientName: String(row.client_name),
    meetingTitle: String(row.meeting_title),
    meetingDate: String(row.meeting_date),
    conversationType: row.conversation_type as ConversationRecord["conversationType"],
    consentAcknowledged: Boolean(row.consent_acknowledged),
    audioStoragePath: (row.audio_storage_path as string | null) ?? null,
    audioFileName: (row.audio_file_name as string | null) ?? null,
    audioMimeType: (row.audio_mime_type as string | null) ?? null,
    audioSizeBytes: row.audio_size_bytes ? Number(row.audio_size_bytes) : null,
    processingStatus: row.processing_status as ConversationRecord["processingStatus"],
    approvedAt: (row.approved_at as string | null) ?? null,
    exportedAt: (row.exported_at as string | null) ?? null,
    failureReason: (row.failure_reason as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapTranscript(row: Record<string, unknown>): TranscriptRecord {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    fullTranscript: String(row.full_transcript),
    detectedLanguage: (row.detected_language as string | null) ?? null,
    transcriptProvider: (row.transcript_provider as string | null) ?? null,
    rawSegments: Array.isArray(row.raw_segments)
      ? (row.raw_segments as TranscriptRecord["rawSegments"])
      : [],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapAnalysis(row: Record<string, unknown>): AiAnalysisRecord {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    analysis: row.analysis as AiAnalysis,
    summary: String(row.summary),
    opportunityLevel: row.opportunity_level as AiAnalysisRecord["opportunityLevel"],
    nextAction: String(row.next_action),
    providerModel: (row.provider_model as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapTask(row: Record<string, unknown>): FollowUpTaskRecord {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    taskText: String(row.task_text),
    dueDate: (row.due_date as string | null) ?? null,
    status: row.status as FollowUpTaskRecord["status"],
    reminderAt: (row.reminder_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapExport(row: Record<string, unknown>): GoogleSheetExportRecord {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    spreadsheetId: String(row.spreadsheet_id),
    sheetName: String(row.sheet_name),
    rowNumber: row.row_number ? Number(row.row_number) : null,
    exportStatus: row.export_status as GoogleSheetExportRecord["exportStatus"],
    exportedAt: (row.exported_at as string | null) ?? null,
    payload: Array.isArray(row.payload) ? (row.payload as string[]) : [],
    errorMessage: (row.error_message as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

async function getConversationRows(
  userId: string,
  client?: ConversationDbClient,
): Promise<ConversationRecord[]> {
  const supabase = await getConversationClient(client);
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("owner_id", userId)
    .neq("processing_status", "deleted")
    .order("meeting_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: Record<string, unknown>) => mapConversation(row));
}

async function getChildMaps(
  conversationIds: string[],
  client?: ConversationDbClient,
): Promise<{
  transcripts: Map<string, TranscriptRecord>;
  analyses: Map<string, AiAnalysisRecord>;
  tasks: Map<string, FollowUpTaskRecord[]>;
  exports: Map<string, GoogleSheetExportRecord>;
}> {
  const supabase = await getConversationClient(client);

  if (conversationIds.length === 0) {
    return {
      transcripts: new Map<string, TranscriptRecord>(),
      analyses: new Map<string, AiAnalysisRecord>(),
      tasks: new Map<string, FollowUpTaskRecord[]>(),
      exports: new Map<string, GoogleSheetExportRecord>(),
    };
  }

  const [transcriptsResult, analysisResult, taskResult, exportResult] =
    await Promise.all([
      supabase
        .from("transcripts")
        .select("*")
        .in("conversation_id", conversationIds),
      supabase
        .from("ai_analysis")
        .select("*")
        .in("conversation_id", conversationIds),
      supabase
        .from("follow_up_tasks")
        .select("*")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: true }),
      supabase
        .from("google_sheet_exports")
        .select("*")
        .in("conversation_id", conversationIds),
    ]);

  if (transcriptsResult.error) throw new Error(transcriptsResult.error.message);
  if (analysisResult.error) throw new Error(analysisResult.error.message);
  if (taskResult.error) throw new Error(taskResult.error.message);
  if (exportResult.error) throw new Error(exportResult.error.message);

  const transcripts = new Map<string, TranscriptRecord>(
    (transcriptsResult.data ?? []).map((row: Record<string, unknown>) => {
      const transcript = mapTranscript(row);
      return [transcript.conversationId, transcript] as const;
    }),
  );
  const analyses = new Map<string, AiAnalysisRecord>(
    (analysisResult.data ?? []).map((row: Record<string, unknown>) => {
      const analysis = mapAnalysis(row);
      return [analysis.conversationId, analysis] as const;
    }),
  );
  const tasks = new Map<string, FollowUpTaskRecord[]>();
  for (const row of (taskResult.data ?? []) as Record<string, unknown>[]) {
    const task = mapTask(row);
    tasks.set(task.conversationId, [...(tasks.get(task.conversationId) ?? []), task]);
  }
  const exports = new Map<string, GoogleSheetExportRecord>(
    (exportResult.data ?? []).map((row: Record<string, unknown>) => {
      const exportRow = mapExport(row);
      return [exportRow.conversationId, exportRow] as const;
    }),
  );

  return { transcripts, analyses, tasks, exports };
}

function matchesFilters(card: DashboardConversationCard, filters: DashboardFilters) {
  const analysis = card.analysis?.analysis;

  if (filters.clientName) {
    const needle = filters.clientName.toLowerCase();
    if (!card.conversation.clientName.toLowerCase().includes(needle)) {
      return false;
    }
  }

  if (filters.date && card.conversation.meetingDate !== filters.date) {
    return false;
  }

  if (
    filters.opportunityLevel &&
    card.analysis?.opportunityLevel !== filters.opportunityLevel
  ) {
    return false;
  }

  if (filters.pendingFollowUps && !card.followUpTasks.some((task) => task.status === "pending")) {
    return false;
  }

  if (filters.color) {
    const needle = filters.color.toLowerCase();
    if (!(analysis?.colorMentions ?? []).some((item) => item.toLowerCase().includes(needle))) {
      return false;
    }
  }

  if (filters.fabric) {
    const needle = filters.fabric.toLowerCase();
    if (!(analysis?.fabricMentions ?? []).some((item) => item.toLowerCase().includes(needle))) {
      return false;
    }
  }

  if (filters.trend) {
    const needle = filters.trend.toLowerCase();
    const haystack = [
      ...(analysis?.designIdeas ?? []),
      ...(analysis?.patternStyleMentions ?? []),
      ...(analysis?.marketTrendInsights ?? []),
      ...(analysis?.machineryOpportunities ?? []),
      ...(analysis?.sourcingOpportunities ?? []),
      ...(analysis?.marketingStrategySuggestions ?? []),
      ...(analysis?.salesStrategySuggestions ?? []),
    ];

    if (!haystack.some((item) => item.toLowerCase().includes(needle))) {
      return false;
    }
  }

  return true;
}

export async function createCapturedConversation(args: {
  userId: string;
  file: File;
  metadata: CaptureConversationInput;
  client?: ConversationDbClient;
}) {
  const supabase = await getConversationClient(args.client);
  const { SUPABASE_AUDIO_BUCKET } = getSupabaseStorageEnv();
  const id = crypto.randomUUID();
  const normalizedMimeType = normalizeMimeType(args.file.type);
  const extensionSafeFileName = safeFileName(
    args.file.name || `conversation-${Date.now()}.webm`,
  );
  const storagePath = `${args.userId}/${id}/${extensionSafeFileName}`;

  const { error: insertError } = await supabase.from("conversations").insert({
    id,
    owner_id: args.userId,
    client_name: args.metadata.clientName,
    meeting_title: args.metadata.meetingTitle,
    meeting_date: args.metadata.meetingDate,
    conversation_type: args.metadata.conversationType,
    consent_acknowledged: args.metadata.consentAcknowledged,
    processing_status: "draft",
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_AUDIO_BUCKET)
    .upload(storagePath, args.file, {
      cacheControl: "3600",
      contentType: normalizedMimeType || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    await supabase
      .from("conversations")
      .update({
        processing_status: "failed",
        failure_reason: uploadError.message,
      })
      .eq("id", id)
      .eq("owner_id", args.userId);

    throw new Error(uploadError.message);
  }

  await supabase
    .from("conversations")
    .update({
      audio_storage_path: storagePath,
      audio_file_name: args.file.name,
      audio_mime_type: normalizedMimeType || null,
      audio_size_bytes: args.file.size,
      processing_status: "uploaded",
      failure_reason: null,
    })
    .eq("id", id)
    .eq("owner_id", args.userId);

  return id;
}

export async function getConversationStatus(
  userId: string,
  conversationId: string,
  client?: ConversationDbClient,
) {
  const detail = await getConversationDetail(userId, conversationId, client);

  if (!detail) {
    return null;
  }

  return {
    conversationId: detail.conversation.id,
    status: detail.conversation.processingStatus,
    failureReason: detail.conversation.failureReason,
    summary: detail.analysis?.summary ?? null,
    followUpTaskCount: detail.followUpTasks.length,
  };
}

export async function getDashboardData(
  userId: string,
  filters: DashboardFilters,
  client?: ConversationDbClient,
): Promise<{
  cards: DashboardConversationCard[];
  metrics: {
    totalConversations: number;
    highOpportunityCount: number;
    pendingTaskCount: number;
    trendSignalCount: number;
    overdueTaskCount: number;
    dueTodayCount: number;
    reminderDueCount: number;
  };
  autopilot: FollowUpAutopilotSummary;
}> {
  const conversations = await getConversationRows(userId, client);
  const ids = conversations.map((conversation: ConversationRecord) => conversation.id);
  const childMaps = await getChildMaps(ids, client);

  const cards = conversations.map((conversation: ConversationRecord) => ({
    conversation,
    analysis: childMaps.analyses.get(conversation.id) ?? null,
    followUpTasks: childMaps.tasks.get(conversation.id) ?? [],
  }));

  const filteredCards = cards.filter((card) => matchesFilters(card, filters));
  const autopilotTasks = cards.flatMap((card) =>
    card.followUpTasks.map((task) =>
      decorateAutopilotTask({
        task,
        conversation: card.conversation,
      }),
    ),
  );
  const autopilot = summarizeAutopilotTasks(autopilotTasks);

  const supabase = await getConversationClient(client);
  const { count: trendCount } = await supabase
    .from("trend_mentions")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userId);

  return {
    cards: filteredCards,
    metrics: {
      totalConversations: cards.length,
      highOpportunityCount: cards.filter(
        (card) => card.analysis?.opportunityLevel === "high",
      ).length,
      pendingTaskCount: cards.flatMap((card) => card.followUpTasks).filter(
        (task) => task.status === "pending",
      ).length,
      trendSignalCount: trendCount ?? 0,
      overdueTaskCount: autopilot.metrics.overdueCount,
      dueTodayCount: autopilot.metrics.dueTodayCount,
      reminderDueCount: autopilot.metrics.reminderDueCount,
    },
    autopilot,
  };
}

export async function getConversationDetail(
  userId: string,
  conversationId: string,
  client?: ConversationDbClient,
): Promise<ConversationDetail | null> {
  const supabase = await getConversationClient(client);
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const conversation = mapConversation(data);
  const childMaps = await getChildMaps([conversationId], client);

  const detail: ConversationDetail = {
    conversation,
    transcript: childMaps.transcripts.get(conversationId) ?? null,
    analysis: childMaps.analyses.get(conversationId) ?? null,
    followUpTasks: childMaps.tasks.get(conversationId) ?? [],
    exportRecord: childMaps.exports.get(conversationId) ?? null,
  };

  return detail;
}

export async function getTrendsData(userId: string, client?: ConversationDbClient) {
  const supabase = await getConversationClient(client);
  const { data, error } = await supabase
    .from("trend_mentions")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const summaryMap = new Map<string, TrendSummary>();

  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const key = `${row.category}:${row.normalized_value}`;
    const existing = summaryMap.get(key);

    if (existing) {
      existing.count += 1;
      continue;
    }

    summaryMap.set(key, {
      category: row.category as TrendSummary["category"],
      label: String(row.label),
      normalizedValue: String(row.normalized_value),
      count: 1,
    });
  }

  const summaries = [...summaryMap.values()].sort((left, right) => right.count - left.count);

  return {
    all: summaries,
    colors: summaries.filter((item) => item.category === "color").slice(0, 8),
    fabrics: summaries.filter((item) => item.category === "fabric").slice(0, 8),
    designs: summaries
      .filter((item) =>
        ["design", "pattern_style", "market_trend"].includes(item.category),
      )
      .slice(0, 10),
    concerns: summaries.filter((item) => item.category === "concern").slice(0, 6),
    opportunities: summaries.filter((item) => item.category === "opportunity").slice(0, 6),
    machinery: summaries.filter((item) => item.category === "machinery").slice(0, 6),
    sourcing: summaries.filter((item) => item.category === "sourcing").slice(0, 6),
    marketingStrategies: summaries
      .filter((item) => item.category === "marketing_strategy")
      .slice(0, 6),
    salesStrategies: summaries
      .filter((item) => item.category === "sales_strategy")
      .slice(0, 6),
  };
}

export async function getFollowUpAutopilotData(
  userId: string,
  client?: ConversationDbClient,
): Promise<FollowUpAutopilotSummary> {
  const conversations = await getConversationRows(userId, client);
  const childMaps = await getChildMaps(
    conversations.map((conversation: ConversationRecord) => conversation.id),
    client,
  );
  const autopilotTasks = conversations.flatMap((conversation) =>
    (childMaps.tasks.get(conversation.id) ?? []).map((task) =>
      decorateAutopilotTask({
        task,
        conversation,
      }),
    ),
  );

  return summarizeAutopilotTasks(autopilotTasks);
}

export async function setConversationStatus(args: {
  userId: string;
  conversationId: string;
  status: ConversationRecord["processingStatus"];
  failureReason?: string | null;
  approvedAt?: string | null;
  exportedAt?: string | null;
  client?: ConversationDbClient;
}) {
  const supabase = await getConversationClient(args.client);
  const updates: Record<string, unknown> = {
    processing_status: args.status,
    failure_reason: args.failureReason ?? null,
  };

  if (args.approvedAt !== undefined) updates.approved_at = args.approvedAt;
  if (args.exportedAt !== undefined) updates.exported_at = args.exportedAt;

  const { error } = await supabase
    .from("conversations")
    .update(updates)
    .eq("id", args.conversationId)
    .eq("owner_id", args.userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveTranscript(args: {
  userId: string;
  conversationId: string;
  transcript: Pick<
    TranscriptRecord,
    "fullTranscript" | "detectedLanguage" | "transcriptProvider" | "rawSegments"
  >;
  client?: ConversationDbClient;
}) {
  const supabase = await getConversationClient(args.client);
  const { error } = await supabase.from("transcripts").upsert(
    {
      conversation_id: args.conversationId,
      owner_id: args.userId,
      full_transcript: args.transcript.fullTranscript,
      detected_language: args.transcript.detectedLanguage,
      transcript_provider: args.transcript.transcriptProvider,
      raw_segments: args.transcript.rawSegments,
    },
    { onConflict: "conversation_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveAnalysis(args: {
  userId: string;
  conversationId: string;
  analysis: AiAnalysis;
  providerModel: string | null;
  client?: ConversationDbClient;
}) {
  const supabase = await getConversationClient(args.client);
  const { error } = await supabase.from("ai_analysis").upsert(
    {
      conversation_id: args.conversationId,
      owner_id: args.userId,
      analysis: args.analysis,
      summary: args.analysis.summary,
      opportunity_level: args.analysis.opportunityLevel,
      next_action: args.analysis.nextAction,
      provider_model: args.providerModel,
    },
    { onConflict: "conversation_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function replaceFollowUpTasks(args: {
  userId: string;
  conversationId: string;
  analysis: AiAnalysis;
  client?: ConversationDbClient;
}) {
  const supabase = await getConversationClient(args.client);
  const { error: deleteError } = await supabase
    .from("follow_up_tasks")
    .delete()
    .eq("conversation_id", args.conversationId)
    .eq("owner_id", args.userId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const tasks = buildFollowUpTasks(args.conversationId, args.analysis);
  if (tasks.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("follow_up_tasks").insert(
    tasks.map((task) => ({
      conversation_id: task.conversationId,
      owner_id: args.userId,
      task_text: task.taskText,
      due_date: task.dueDate,
      reminder_at: task.reminderAt,
      status: task.status,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function replaceTrendMentions(args: {
  userId: string;
  conversationId: string;
  analysis: AiAnalysis;
  client?: ConversationDbClient;
}) {
  const supabase = await getConversationClient(args.client);
  const { error: deleteError } = await supabase
    .from("trend_mentions")
    .delete()
    .eq("conversation_id", args.conversationId)
    .eq("owner_id", args.userId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const mentions = buildTrendMentions(args.conversationId, args.analysis);
  if (mentions.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("trend_mentions").insert(
    mentions.map((mention) => ({
      conversation_id: mention.conversationId,
      owner_id: args.userId,
      category: mention.category,
      label: mention.label,
      normalized_value: mention.normalizedValue,
      mention_count: mention.mentionCount,
      source_field: mention.sourceField,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function saveReviewEdits(args: {
  userId: string;
  conversationId: string;
  analysis: AiAnalysis;
  tasks: Array<{
    taskText: string;
    dueDate: string | null;
    reminderAt: string | null;
    status: "pending" | "completed";
  }>;
  client?: ConversationDbClient;
}) {
  await saveAnalysis({
    userId: args.userId,
    conversationId: args.conversationId,
    analysis: args.analysis,
    providerModel: "manual-review",
    client: args.client,
  });

  const supabase = await getConversationClient(args.client);
  const { error: deleteError } = await supabase
    .from("follow_up_tasks")
    .delete()
    .eq("conversation_id", args.conversationId)
    .eq("owner_id", args.userId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (args.tasks.length > 0) {
    const { error } = await supabase.from("follow_up_tasks").insert(
      args.tasks.map((task) => ({
        conversation_id: args.conversationId,
        owner_id: args.userId,
        task_text: task.taskText,
        due_date: normalizeDateInput(task.dueDate),
        reminder_at:
          normalizeReminderInput(task.reminderAt) ??
          buildDefaultReminderAt(normalizeDateInput(task.dueDate)),
        status: task.status,
        completed_at:
          task.status === "completed" ? new Date().toISOString() : null,
      })),
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  await setConversationStatus({
    userId: args.userId,
    conversationId: args.conversationId,
    status: "review_required",
    failureReason: null,
    client: args.client,
  });
}

export async function approveAndExportConversation(
  userId: string,
  conversationId: string,
  client?: ConversationDbClient,
) {
  const detail = await getConversationDetail(userId, conversationId, client);

  if (!detail || !detail.analysis) {
    throw new Error("Conversation analysis is not ready for export.");
  }

  if (detail.conversation.processingStatus === "exported") {
    return detail;
  }

  const approvedAt = detail.conversation.approvedAt ?? new Date().toISOString();
  await setConversationStatus({
    userId,
    conversationId,
    status: "approved",
    approvedAt,
    failureReason: null,
    client,
  });

  await replaceTrendMentions({
    userId,
    conversationId,
    analysis: detail.analysis.analysis,
    client,
  });

  const audioLink = `${getAppUrl()}/api/conversations/${conversationId}/audio`;
  const payload = buildConversationSheetRow({
    appUrl: getAppUrl(),
    analysis: detail.analysis,
    audioLink,
    conversation: detail.conversation,
    followUpTasks: detail.followUpTasks,
  });

  try {
    const exportResult = await appendConversationRow(payload);
    const supabase = await getConversationClient(client);
    const exportedAt = new Date().toISOString();

    const { error } = await supabase.from("google_sheet_exports").upsert(
      {
        conversation_id: conversationId,
        owner_id: userId,
        spreadsheet_id: exportResult.spreadsheetId,
        sheet_name: exportResult.sheetName,
        row_number: exportResult.rowNumber,
        export_status: "success",
        exported_at: exportedAt,
        payload,
        error_message: null,
      },
      { onConflict: "conversation_id" },
    );

    if (error) {
      throw new Error(error.message);
    }

    await setConversationStatus({
      userId,
      conversationId,
      status: "exported",
      approvedAt,
      exportedAt,
      failureReason: null,
      client,
    });

    return getConversationDetail(userId, conversationId, client);
  } catch (error) {
    const supabase = await getConversationClient(client);
    await supabase.from("google_sheet_exports").upsert(
      {
        conversation_id: conversationId,
        owner_id: userId,
        spreadsheet_id: "",
        sheet_name: "",
        row_number: null,
        export_status: "failed",
        exported_at: null,
        payload,
        error_message: error instanceof Error ? error.message : "Export failed.",
      },
      { onConflict: "conversation_id" },
    );
    throw error;
  }
}

export async function updateFollowUpTask(args: {
  userId: string;
  taskId: string;
  action: "complete" | "reopen" | "snooze" | "update";
  taskText?: string;
  dueDate?: string | null;
  reminderAt?: string | null;
  status?: "pending" | "completed";
  client?: ConversationDbClient;
}) {
  const supabase = await getConversationClient(args.client);
  const { data, error } = await supabase
    .from("follow_up_tasks")
    .select("*")
    .eq("id", args.taskId)
    .eq("owner_id", args.userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Follow-up task not found.");
  }

  const currentTask = mapTask(data);
  const updates: Record<string, unknown> = {};

  switch (args.action) {
    case "complete":
      updates.status = "completed";
      updates.completed_at = new Date().toISOString();
      break;
    case "reopen":
      updates.status = "pending";
      updates.completed_at = null;
      break;
    case "snooze":
      updates.status = "pending";
      updates.completed_at = null;
      updates.reminder_at = applySnoozeWindow(
        currentTask.reminderAt,
        currentTask.dueDate,
      );
      break;
    case "update": {
      if (args.taskText !== undefined) {
        const normalizedTaskText = args.taskText.trim();
        if (!normalizedTaskText) {
          throw new Error("Task text cannot be empty.");
        }
        updates.task_text = normalizedTaskText;
      }

      if (args.dueDate !== undefined) {
        const normalizedDueDate = normalizeDateInput(args.dueDate);
        updates.due_date = normalizedDueDate;

        if (args.reminderAt === undefined) {
          updates.reminder_at =
            currentTask.reminderAt ??
            buildDefaultReminderAt(normalizedDueDate);
        }
      }

      if (args.reminderAt !== undefined) {
        updates.reminder_at = normalizeReminderInput(args.reminderAt);
      }

      if (args.status !== undefined) {
        updates.status = args.status;
        updates.completed_at =
          args.status === "completed" ? new Date().toISOString() : null;
      }
      break;
    }
  }

  const { error: updateError } = await supabase
    .from("follow_up_tasks")
    .update(updates)
    .eq("id", args.taskId)
    .eq("owner_id", args.userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { ok: true };
}

export async function deleteConversationAssets(
  userId: string,
  conversationId: string,
  client?: ConversationDbClient,
) {
  const detail = await getConversationDetail(userId, conversationId, client);
  if (!detail) {
    return null;
  }

  const supabase = await getConversationClient(client);
  const { SUPABASE_AUDIO_BUCKET } = getSupabaseStorageEnv();

  if (detail.conversation.audioStoragePath) {
    await supabase.storage
      .from(SUPABASE_AUDIO_BUCKET)
      .remove([detail.conversation.audioStoragePath]);
  }

  await Promise.all([
    supabase
      .from("transcripts")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("owner_id", userId),
    supabase
      .from("ai_analysis")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("owner_id", userId),
    supabase
      .from("follow_up_tasks")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("owner_id", userId),
    supabase
      .from("trend_mentions")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("owner_id", userId),
  ]);

  await supabase
    .from("conversations")
    .update({
      audio_storage_path: null,
      audio_file_name: null,
      audio_mime_type: null,
      audio_size_bytes: null,
      processing_status: "deleted",
      failure_reason: null,
    })
    .eq("id", conversationId)
    .eq("owner_id", userId);

  return {
    deletedExportedConversation:
      detail.conversation.processingStatus === "exported" ||
      detail.conversation.processingStatus === "approved",
  };
}

export async function getConversationAudioSignedUrl(
  userId: string,
  conversationId: string,
  client?: ConversationDbClient,
) {
  const detail = await getConversationDetail(userId, conversationId, client);

  if (!detail?.conversation.audioStoragePath) {
    return null;
  }

  const { SUPABASE_AUDIO_BUCKET } = getSupabaseStorageEnv();
  const supabase = await getConversationClient(client);
  const { data, error } = await supabase.storage
    .from(SUPABASE_AUDIO_BUCKET)
    .createSignedUrl(detail.conversation.audioStoragePath, 60);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}
