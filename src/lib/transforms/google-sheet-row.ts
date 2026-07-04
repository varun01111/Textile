import type {
  AiAnalysisRecord,
  ConversationRecord,
  FollowUpTaskRecord,
} from "@/lib/types";

const sheetHeaders = [
  "Date",
  "Client Name",
  "Meeting Title",
  "Conversation Type",
  "Summary",
  "Important Business Points",
  "Client Preferences",
  "Design Ideas",
  "Colors Mentioned",
  "Fabrics/Materials Mentioned",
  "Patterns/Styles Mentioned",
  "Market Trend Insights",
  "Pricing Discussion",
  "Possible Orders",
  "Follow-up Tasks",
  "Deadline",
  "Opportunity Level",
  "Next Action",
  "Full Transcript Link",
  "Audio File Link",
] as const;

export function getSheetHeaders() {
  return [...sheetHeaders];
}

function prefixLines(prefix: string, values: string[]) {
  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => `${prefix}: ${value}`);
}

function serializeLines(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .join(" | ");
}

export function buildConversationSheetRow(args: {
  appUrl: string;
  analysis: AiAnalysisRecord;
  audioLink: string;
  conversation: ConversationRecord;
  followUpTasks: FollowUpTaskRecord[];
}) {
  const { appUrl, analysis, audioLink, conversation, followUpTasks } = args;
  const transcriptLink = `${appUrl}/conversations/${conversation.id}`;
  const dueDates = analysis.analysis.deadlines.join(" | ");
  const importantBusinessPoints = serializeLines([
    ...analysis.analysis.importantBusinessPoints,
    ...prefixLines("Opportunity", analysis.analysis.newOpportunities),
    ...prefixLines("Machinery", analysis.analysis.machineryOpportunities),
    ...prefixLines("Sourcing", analysis.analysis.sourcingOpportunities),
  ]);
  const marketTrendInsights = serializeLines([
    ...analysis.analysis.marketTrendInsights,
    ...prefixLines("Marketing", analysis.analysis.marketingStrategySuggestions),
    ...prefixLines("Sales", analysis.analysis.salesStrategySuggestions),
  ]);

  return [
    conversation.meetingDate,
    conversation.clientName,
    conversation.meetingTitle,
    conversation.conversationType,
    analysis.summary,
    importantBusinessPoints,
    analysis.analysis.clientPreferences.join(" | "),
    analysis.analysis.designIdeas.join(" | "),
    analysis.analysis.colorMentions.join(" | "),
    analysis.analysis.fabricMentions.join(" | "),
    analysis.analysis.patternStyleMentions.join(" | "),
    marketTrendInsights,
    analysis.analysis.pricingDiscussion.join(" | "),
    analysis.analysis.possibleOrders.join(" | "),
    followUpTasks.map((task) => task.taskText).join(" | "),
    dueDates,
    analysis.opportunityLevel,
    analysis.nextAction,
    transcriptLink,
    audioLink,
  ];
}
