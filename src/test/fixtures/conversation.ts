import type {
  AiAnalysisRecord,
  ConversationRecord,
  FollowUpTaskRecord,
} from "@/lib/types";

export const baseConversation: ConversationRecord = {
  id: "f3d55250-18cb-4c0a-b8d5-7c7ec6bdaf21",
  ownerId: "76f44167-c2a4-42a0-8e09-d59dce0709b7",
  clientName: "Niya Studio",
  meetingTitle: "Festive capsule follow-up",
  meetingDate: "2026-06-29",
  conversationType: "in_person",
  consentAcknowledged: true,
  audioStoragePath: "76f44167-c2a4-42a0-8e09-d59dce0709b7/f3d55250-18cb-4c0a-b8d5-7c7ec6bdaf21/demo.webm",
  audioFileName: "demo.webm",
  audioMimeType: "audio/webm",
  audioSizeBytes: 1_048_576,
  processingStatus: "review_required",
  approvedAt: null,
  exportedAt: null,
  failureReason: null,
  createdAt: "2026-06-29T12:00:00.000Z",
  updatedAt: "2026-06-29T12:05:00.000Z",
};

export const baseAnalysis: AiAnalysisRecord = {
  id: "35cc50b2-ef7a-4f9b-8e28-7748a605b419",
  conversationId: baseConversation.id,
  summary:
    "The client is interested in a breathable festive capsule using terracotta and sage tones.",
  opportunityLevel: "high",
  nextAction: "Send swatches and a pricing note by next Friday.",
  providerModel: "mock",
  createdAt: "2026-06-29T12:05:00.000Z",
  updatedAt: "2026-06-29T12:05:00.000Z",
  analysis: {
    summary:
      "The client is interested in a breathable festive capsule using terracotta and sage tones.",
    importantBusinessPoints: [
      "Client is warm on a festive capsule if price stays controlled.",
    ],
    clientPreferences: ["Breathable cotton-linen blends"],
    designIdeas: ["Festive co-ord sets"],
    fabricMentions: ["Cotton-linen blend"],
    colorMentions: ["Terracotta", "Sage green"],
    patternStyleMentions: ["Subtle floral embroidery"],
    marketTrendInsights: ["Breathable festive wear is gaining interest."],
    pricingDiscussion: ["Pricing has to stay accessible for bulk."],
    possibleOrders: ["Trial festive sample order"],
    followUpTasks: [
      { task: "Send swatches", dueDate: "Next Friday" },
      { task: "Share pricing note", dueDate: "Next Friday" },
    ],
    deadlines: ["Next Friday"],
    clientConcerns: ["Embroidery cost could reduce order size."],
    newOpportunities: ["Recurring festive capsule line"],
    machineryOpportunities: ["Evaluate a premium embroidery machinery upgrade for faster sampling."],
    sourcingOpportunities: ["Compare alternate cotton-linen sourcing to protect margins."],
    marketingStrategySuggestions: ["Use physical swatch presentations for festive buyers."],
    salesStrategySuggestions: ["Lead with a trial-order pitch before expanding into a larger seasonal program."],
    ignoredCasualTalk: ["Greetings"],
    opportunityLevel: "high",
    nextAction: "Send swatches and a pricing note by next Friday.",
  },
};

export const baseTasks: FollowUpTaskRecord[] = [
  {
    id: "60f7a8d1-6147-41d8-b0d6-b6a280d7a4a1",
    conversationId: baseConversation.id,
    taskText: "Send swatches",
    dueDate: "Next Friday",
    status: "pending",
    reminderAt: null,
    completedAt: null,
    createdAt: "2026-06-29T12:05:00.000Z",
    updatedAt: "2026-06-29T12:05:00.000Z",
  },
  {
    id: "4f8d66d0-e726-4b8d-b1e8-a3eca0ad9da0",
    conversationId: baseConversation.id,
    taskText: "Share pricing note",
    dueDate: "Next Friday",
    status: "pending",
    reminderAt: null,
    completedAt: null,
    createdAt: "2026-06-29T12:05:00.000Z",
    updatedAt: "2026-06-29T12:05:00.000Z",
  },
];
