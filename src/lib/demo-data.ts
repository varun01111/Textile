import { addDays, format, set, subDays } from "date-fns";

import {
  buildDefaultReminderAt,
  decorateAutopilotTask,
  summarizeAutopilotTasks,
} from "@/lib/follow-up-autopilot";
import { buildTrendMentions } from "@/lib/transforms/trend-normalization";
import type {
  AiAnalysis,
  AiAnalysisRecord,
  ConversationDetail,
  ConversationRecord,
  DashboardConversationCard,
  FollowUpAutopilotSummary,
  FollowUpTaskRecord,
  GoogleSheetExportRecord,
  TranscriptRecord,
  TrendSummary,
} from "@/lib/types";

const demoOwnerId = "demo-owner";

function toIsoDate(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function toIsoStamp(value: Date, hour = 11) {
  return set(value, {
    hours: hour,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  }).toISOString();
}

function createConversationRecord(args: {
  id: string;
  clientName: string;
  meetingTitle: string;
  meetingDate: string;
  conversationType: ConversationRecord["conversationType"];
  processingStatus: ConversationRecord["processingStatus"];
  approvedAt?: string | null;
  exportedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: args.id,
    ownerId: demoOwnerId,
    clientName: args.clientName,
    meetingTitle: args.meetingTitle,
    meetingDate: args.meetingDate,
    conversationType: args.conversationType,
    consentAcknowledged: true,
    audioStoragePath: "demo/audio/textile-sample-call.wav",
    audioFileName: "textile-sample-call.wav",
    audioMimeType: "audio/wav",
    audioSizeBytes: 731092,
    processingStatus: args.processingStatus,
    approvedAt: args.approvedAt ?? null,
    exportedAt: args.exportedAt ?? null,
    failureReason: null,
    createdAt: args.createdAt,
    updatedAt: args.updatedAt,
  } satisfies ConversationRecord;
}

function createTranscriptRecord(args: {
  id: string;
  conversationId: string;
  fullTranscript: string;
  rawSegments: TranscriptRecord["rawSegments"];
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: args.id,
    conversationId: args.conversationId,
    fullTranscript: args.fullTranscript,
    detectedLanguage: "en",
    transcriptProvider: "mock-demo",
    rawSegments: args.rawSegments,
    createdAt: args.createdAt,
    updatedAt: args.updatedAt,
  } satisfies TranscriptRecord;
}

function createAnalysisRecord(args: {
  id: string;
  conversationId: string;
  analysis: AiAnalysis;
  providerModel: string;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: args.id,
    conversationId: args.conversationId,
    analysis: args.analysis,
    summary: args.analysis.summary,
    opportunityLevel: args.analysis.opportunityLevel,
    nextAction: args.analysis.nextAction,
    providerModel: args.providerModel,
    createdAt: args.createdAt,
    updatedAt: args.updatedAt,
  } satisfies AiAnalysisRecord;
}

function createTaskRecord(args: {
  id: string;
  conversationId: string;
  taskText: string;
  dueDate: string | null;
  reminderAt?: string | null;
  status?: FollowUpTaskRecord["status"];
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}) {
  return {
    id: args.id,
    conversationId: args.conversationId,
    taskText: args.taskText,
    dueDate: args.dueDate,
    reminderAt:
      args.reminderAt === undefined
        ? buildDefaultReminderAt(args.dueDate)
        : args.reminderAt,
    status: args.status ?? "pending",
    completedAt: args.completedAt ?? null,
    createdAt: args.createdAt,
    updatedAt: args.updatedAt,
  } satisfies FollowUpTaskRecord;
}

function createExportRecord(args: {
  id: string;
  conversationId: string;
  rowNumber: number;
  exportedAt: string;
}) {
  return {
    id: args.id,
    conversationId: args.conversationId,
    spreadsheetId: "1XqQHz3ILTQIgLv9deeckNNcspsa6yz2CQNyEA66kgCM",
    sheetName: "Conversations",
    rowNumber: args.rowNumber,
    exportStatus: "success",
    exportedAt: args.exportedAt,
    payload: [],
    errorMessage: null,
    createdAt: args.exportedAt,
  } satisfies GoogleSheetExportRecord;
}

function buildDemoDetails(): ConversationDetail[] {
  const now = new Date();
  const meetingOne = subDays(now, 1);
  const meetingTwo = subDays(now, 2);
  const meetingThree = subDays(now, 4);

  const meetingOneDate = toIsoDate(meetingOne);
  const meetingTwoDate = toIsoDate(meetingTwo);
  const meetingThreeDate = toIsoDate(meetingThree);

  const createdOne = toIsoStamp(meetingOne, 12);
  const createdTwo = toIsoStamp(meetingTwo, 14);
  const createdThree = toIsoStamp(meetingThree, 16);
  const exportedOne = toIsoStamp(now, 9);
  const approvedThree = toIsoStamp(subDays(now, 1), 18);

  const analysisOne: AiAnalysis = {
    summary:
      "The buyer is ready to test a festive capsule in terracotta and sage, but wants premium embroidery kept inside a safe bulk price band before confirming the first order.",
    importantBusinessPoints: [
      "Buyer asked for a 120-piece trial order split across two colorways.",
      "Festive capsule needs premium finishing without pushing wholesale pricing too high.",
      "A swatch board and revised costing are the final blockers before the PO.",
    ],
    clientPreferences: [
      "Breathable cotton-linen blends for festive wear",
      "Muted earth palettes over bright jewel tones",
      "Embroidery that looks premium but remains commercially scalable",
    ],
    designIdeas: [
      "Festive co-ord sets with restrained neckline embroidery",
      "Kurta sets with soft drape and light surface detailing",
    ],
    fabricMentions: ["Cotton-linen blend", "Cotton sateen"],
    colorMentions: ["Terracotta", "Sage green", "Muted gold"],
    patternStyleMentions: ["Subtle floral embroidery", "Minimal motif placement"],
    marketTrendInsights: [
      "Retail buyers are favoring breathable festive assortments over heavy embellished occasionwear.",
    ],
    pricingDiscussion: [
      "Target wholesale must stay below the buyer's festive entry-price threshold.",
      "Embroidery density should be optimized to protect margin on the 120-piece run.",
    ],
    possibleOrders: ["120-piece festive trial capsule order"],
    followUpTasks: [
      {
        task: "Send terracotta and sage swatch board with embroidery references",
        dueDate: toIsoDate(now),
      },
      {
        task: "Share revised costing for 120-piece trial order",
        dueDate: toIsoDate(addDays(now, 1)),
      },
    ],
    deadlines: [toIsoDate(now), toIsoDate(addDays(now, 1))],
    clientConcerns: [
      "Premium embroidery could push the bulk order out of the buyer's target band.",
    ],
    newOpportunities: [
      "Pitch the festive capsule as a repeatable seasonal program for regional boutiques.",
    ],
    machineryOpportunities: [
      "Test an embroidery machine setup that can deliver premium festive detailing without slowing sampling speed.",
    ],
    sourcingOpportunities: [
      "Line up alternate cotton-linen sourcing options that preserve hand-feel while protecting the buyer's cost ceiling.",
    ],
    marketingStrategySuggestions: [
      "Present the festive line through physical swatch appointments and boutique walkthroughs instead of only digital decks.",
    ],
    salesStrategySuggestions: [
      "Anchor the sale around a 120-piece trial capsule, then expand into a repeat seasonal buy after first sell-through.",
    ],
    ignoredCasualTalk: ["Small talk about store traffic and travel schedules."],
    opportunityLevel: "high",
    nextAction:
      "Deliver the swatch board today and revised costing tomorrow morning to secure the trial order.",
  };

  const analysisTwo: AiAnalysis = {
    summary:
      "The client likes the monsoon linen direction and yarn-dyed stripes, but wants clearer costing, faster sample closure, and reassurance that the collection can launch before the next buying window.",
    importantBusinessPoints: [
      "Client wants three monsoon-ready linen SKUs finalized this week.",
      "Costing on yarn-dyed stripe options is still unclear.",
      "Sample turnaround speed is now affecting launch confidence.",
    ],
    clientPreferences: [
      "Washed linen blends with soft hand feel",
      "Indigo, mist blue, and ivory for monsoon storytelling",
      "Subtle stripe play instead of loud prints",
    ],
    designIdeas: [
      "Relaxed monsoon shirts with yarn-dyed stripe panels",
      "Easy lounge sets with softened ivory-indigo contrast",
    ],
    fabricMentions: ["Washed linen blend", "Yarn-dyed cotton stripe"],
    colorMentions: ["Indigo", "Mist blue", "Ivory"],
    patternStyleMentions: ["Vertical stripe detailing", "Minimal contrast piping"],
    marketTrendInsights: [
      "Stores want monsoon collections that feel lightweight and polished rather than purely casual.",
    ],
    pricingDiscussion: [
      "Stripe program needs clearer costing before the buyer commits to line depth.",
    ],
    possibleOrders: ["Three-SKU monsoon launch assortment"],
    followUpTasks: [
      {
        task: "Confirm yarn-dyed stripe costing with the mill",
        dueDate: toIsoDate(subDays(now, 1)),
      },
      {
        task: "Lock the final three monsoon launch SKUs",
        dueDate: toIsoDate(addDays(now, 3)),
      },
    ],
    deadlines: [toIsoDate(subDays(now, 1)), toIsoDate(addDays(now, 3))],
    clientConcerns: [
      "Delayed costing could make the client miss the monsoon retail launch window.",
    ],
    newOpportunities: [
      "Bundle the monsoon shirts with matching lounge bottoms for a higher basket value offer.",
    ],
    machineryOpportunities: [
      "Review whether faster cutting or finishing equipment can shorten sample closure for the monsoon line.",
    ],
    sourcingOpportunities: [
      "Secure a more responsive yarn-dyed stripe supplier so launch timing is less exposed.",
    ],
    marketingStrategySuggestions: [
      "Shift the collection pitch toward tactile monsoon storyboards and showroom presentations for buyers.",
    ],
    salesStrategySuggestions: [
      "Sell the monsoon program as a tightly edited three-SKU launch to reduce buyer hesitation and speed commitment.",
    ],
    ignoredCasualTalk: ["Discussion about courier delays and seasonal weather."],
    opportunityLevel: "medium",
    nextAction:
      "Resolve stripe costing immediately and send the final SKU shortlist before the week closes.",
  };

  const analysisThree: AiAnalysis = {
    summary:
      "The boutique reseller is ready to reorder best-selling neutrals and is also curious about adding handcrafted print accessories as an upsell story for the next drop.",
    importantBusinessPoints: [
      "Core reorder is ready for approval on the boutique's best-selling neutral pieces.",
      "Accessory add-ons could raise average order value on the next drop.",
    ],
    clientPreferences: [
      "Soft muslin and cotton voile for boutique-ready comfort",
      "Ivory, sandalwood, and dusty rose neutrals",
    ],
    designIdeas: [
      "Easy boutique kurtas with contrast facing",
      "Accessory story using block-print scarves and pouches",
    ],
    fabricMentions: ["Cotton voile", "Soft muslin"],
    colorMentions: ["Ivory", "Sandalwood", "Dusty rose"],
    patternStyleMentions: ["Hand block accents", "Delicate contrast facing"],
    marketTrendInsights: [
      "Boutiques are using coordinated accessories to improve perceived exclusivity without redesigning the base garment.",
    ],
    pricingDiscussion: [
      "Accessory add-ons should sit in an impulse-friendly band for boutique shoppers.",
    ],
    possibleOrders: ["Reorder of best-selling neutral kurtas", "Accessory add-on capsule"],
    followUpTasks: [
      {
        task: "Send reorder confirmation to the boutique buyer",
        dueDate: toIsoDate(subDays(now, 2)),
      },
      {
        task: "Draft accessory add-on concept for the next drop",
        dueDate: null,
      },
    ],
    deadlines: [toIsoDate(subDays(now, 2))],
    clientConcerns: [
      "Accessory add-ons must stay cohesive with the boutique's calm visual language.",
    ],
    newOpportunities: [
      "Launch a boutique-exclusive accessory story built around the top reorder colors.",
    ],
    machineryOpportunities: [
      "Explore small-batch finishing capacity that can support accessory add-ons without disrupting garment production.",
    ],
    sourcingOpportunities: [
      "Identify artisan or print-source partners who can supply accessory trims in boutique-scale quantities.",
    ],
    marketingStrategySuggestions: [
      "Support the next drop with in-store storytelling around handcrafted accessory pairings.",
    ],
    salesStrategySuggestions: [
      "Sell the accessory story as an add-on bundle to raise average order value on each reorder cycle.",
    ],
    ignoredCasualTalk: ["General remarks on weekend walk-in traffic."],
    opportunityLevel: "high",
    nextAction:
      "Confirm the reorder immediately and present one accessory upsell concept for the next collection drop.",
  };

  const conversationOne = createConversationRecord({
    id: "demo-festive-capsule",
    clientName: "Kalpana Textiles",
    meetingTitle: "Festive Capsule Buyer Review",
    meetingDate: meetingOneDate,
    conversationType: "video_call",
    processingStatus: "exported",
    approvedAt: exportedOne,
    exportedAt: exportedOne,
    createdAt: createdOne,
    updatedAt: exportedOne,
  });
  const conversationTwo = createConversationRecord({
    id: "demo-monsoon-linen",
    clientName: "Aarya Fabrics",
    meetingTitle: "Monsoon Linen Range Alignment",
    meetingDate: meetingTwoDate,
    conversationType: "phone_call",
    processingStatus: "review_required",
    createdAt: createdTwo,
    updatedAt: toIsoStamp(now, 10),
  });
  const conversationThree = createConversationRecord({
    id: "demo-boutique-reorder",
    clientName: "Saanvi Studio",
    meetingTitle: "Boutique Reorder and Accessory Upsell",
    meetingDate: meetingThreeDate,
    conversationType: "in_person",
    processingStatus: "approved",
    approvedAt: approvedThree,
    createdAt: createdThree,
    updatedAt: approvedThree,
  });

  const transcriptOne = createTranscriptRecord({
    id: "demo-transcript-1",
    conversationId: conversationOne.id,
    fullTranscript:
      "The buyer wants a festive capsule in terracotta and sage, likes breathable cotton-linen, and needs revised costing before confirming a 120-piece order.",
    rawSegments: [
      {
        speaker: "Buyer",
        startMs: 0,
        endMs: 7000,
        text: "The terracotta and sage story feels right for our festive edit, but I need the embroidery to look premium without blowing up the wholesale price.",
      },
      {
        speaker: "You",
        startMs: 7000,
        endMs: 14000,
        text: "We can keep it on breathable cotton-linen blends and simplify the motif density so the margin stays healthy.",
      },
      {
        speaker: "Buyer",
        startMs: 14000,
        endMs: 23000,
        text: "Send me the swatch board and a revised quote quickly, because I can test a 120-piece trial order if those two things land well.",
      },
    ],
    createdAt: createdOne,
    updatedAt: exportedOne,
  });
  const transcriptTwo = createTranscriptRecord({
    id: "demo-transcript-2",
    conversationId: conversationTwo.id,
    fullTranscript:
      "The client is positive on monsoon linen, but yarn-dyed stripe costing and sample timing are still slowing the decision.",
    rawSegments: [
      {
        speaker: "Client",
        startMs: 0,
        endMs: 6000,
        text: "I like the washed linen direction and the indigo-ivory stripe story, but I still do not have clear costing on the stripe option.",
      },
      {
        speaker: "You",
        startMs: 6000,
        endMs: 13500,
        text: "We can close that with the mill today and narrow the line to three monsoon-ready SKUs for faster approval.",
      },
      {
        speaker: "Client",
        startMs: 13500,
        endMs: 22000,
        text: "That would help, because if the sample closure slips too much we lose the launch window.",
      },
    ],
    createdAt: createdTwo,
    updatedAt: toIsoStamp(now, 10),
  });
  const transcriptThree = createTranscriptRecord({
    id: "demo-transcript-3",
    conversationId: conversationThree.id,
    fullTranscript:
      "The boutique wants a reorder on core neutral pieces and is open to accessory add-ons if the add-ons stay calm, soft, and premium.",
    rawSegments: [
      {
        speaker: "Boutique buyer",
        startMs: 0,
        endMs: 6000,
        text: "The ivory and dusty rose pieces are moving well, so I am ready for the reorder on those silhouettes.",
      },
      {
        speaker: "You",
        startMs: 6000,
        endMs: 14000,
        text: "Would a small accessory layer, like block-print scarves or pouches, fit your next drop without disrupting the calm aesthetic?",
      },
      {
        speaker: "Boutique buyer",
        startMs: 14000,
        endMs: 22000,
        text: "Yes, as long as the add-ons stay cohesive and do not feel too loud next to the neutral garments.",
      },
    ],
    createdAt: createdThree,
    updatedAt: approvedThree,
  });

  const analysisRecordOne = createAnalysisRecord({
    id: "demo-analysis-1",
    conversationId: conversationOne.id,
    analysis: analysisOne,
    providerModel: "mock-demo",
    createdAt: createdOne,
    updatedAt: exportedOne,
  });
  const analysisRecordTwo = createAnalysisRecord({
    id: "demo-analysis-2",
    conversationId: conversationTwo.id,
    analysis: analysisTwo,
    providerModel: "mock-demo",
    createdAt: createdTwo,
    updatedAt: toIsoStamp(now, 10),
  });
  const analysisRecordThree = createAnalysisRecord({
    id: "demo-analysis-3",
    conversationId: conversationThree.id,
    analysis: analysisThree,
    providerModel: "mock-demo",
    createdAt: createdThree,
    updatedAt: approvedThree,
  });

  const tasksOne = [
    createTaskRecord({
      id: "demo-task-1a",
      conversationId: conversationOne.id,
      taskText: "Send terracotta and sage swatch board with embroidery references",
      dueDate: toIsoDate(now),
      createdAt: createdOne,
      updatedAt: toIsoStamp(now, 8),
    }),
    createTaskRecord({
      id: "demo-task-1b",
      conversationId: conversationOne.id,
      taskText: "Share revised costing for 120-piece trial order",
      dueDate: toIsoDate(addDays(now, 1)),
      createdAt: createdOne,
      updatedAt: toIsoStamp(now, 8),
    }),
  ];
  const tasksTwo = [
    createTaskRecord({
      id: "demo-task-2a",
      conversationId: conversationTwo.id,
      taskText: "Confirm yarn-dyed stripe costing with the mill",
      dueDate: toIsoDate(subDays(now, 1)),
      createdAt: createdTwo,
      updatedAt: toIsoStamp(now, 7),
    }),
    createTaskRecord({
      id: "demo-task-2b",
      conversationId: conversationTwo.id,
      taskText: "Lock the final three monsoon launch SKUs",
      dueDate: toIsoDate(addDays(now, 3)),
      createdAt: createdTwo,
      updatedAt: toIsoStamp(now, 7),
    }),
  ];
  const tasksThree = [
    createTaskRecord({
      id: "demo-task-3a",
      conversationId: conversationThree.id,
      taskText: "Send reorder confirmation to the boutique buyer",
      dueDate: toIsoDate(subDays(now, 2)),
      status: "completed",
      reminderAt: buildDefaultReminderAt(toIsoDate(subDays(now, 2))),
      completedAt: toIsoStamp(subDays(now, 1), 17),
      createdAt: createdThree,
      updatedAt: toIsoStamp(subDays(now, 1), 17),
    }),
    createTaskRecord({
      id: "demo-task-3b",
      conversationId: conversationThree.id,
      taskText: "Draft accessory add-on concept for the next drop",
      dueDate: null,
      reminderAt: null,
      createdAt: createdThree,
      updatedAt: approvedThree,
    }),
  ];

  const exportOne = createExportRecord({
    id: "demo-export-1",
    conversationId: conversationOne.id,
    rowNumber: 14,
    exportedAt: exportedOne,
  });

  return [
    {
      conversation: conversationOne,
      transcript: transcriptOne,
      analysis: analysisRecordOne,
      followUpTasks: tasksOne,
      exportRecord: exportOne,
    },
    {
      conversation: conversationTwo,
      transcript: transcriptTwo,
      analysis: analysisRecordTwo,
      followUpTasks: tasksTwo,
      exportRecord: null,
    },
    {
      conversation: conversationThree,
      transcript: transcriptThree,
      analysis: analysisRecordThree,
      followUpTasks: tasksThree,
      exportRecord: null,
    },
  ];
}

function buildTrendSummaries(details: ConversationDetail[]) {
  const mentions = details
    .filter((detail) =>
      ["approved", "exported"].includes(detail.conversation.processingStatus),
    )
    .flatMap((detail) =>
      detail.analysis
        ? buildTrendMentions(detail.conversation.id, detail.analysis.analysis)
        : [],
    );

  const summaryMap = new Map<string, TrendSummary>();

  for (const mention of mentions) {
    const key = `${mention.category}:${mention.normalizedValue}`;
    const existing = summaryMap.get(key);

    if (existing) {
      existing.count += 1;
      continue;
    }

    summaryMap.set(key, {
      category: mention.category,
      label: mention.label,
      normalizedValue: mention.normalizedValue,
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
    rawCount: mentions.length,
  };
}

export function getDemoConversationDetails() {
  return buildDemoDetails();
}

export function getDemoConversationDetail(conversationId: string) {
  return getDemoConversationDetails().find(
    (detail) => detail.conversation.id === conversationId,
  ) ?? null;
}

export function getDemoDashboardData(): {
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
} {
  const details = getDemoConversationDetails();
  const cards = details.map((detail) => ({
    conversation: detail.conversation,
    analysis: detail.analysis,
    followUpTasks: detail.followUpTasks,
  }));
  const autopilot = summarizeAutopilotTasks(
    details.flatMap((detail) =>
      detail.followUpTasks.map((task) =>
        decorateAutopilotTask({
          task,
          conversation: detail.conversation,
        }),
      ),
    ),
  );
  const trends = buildTrendSummaries(details);

  return {
    cards,
    metrics: {
      totalConversations: cards.length,
      highOpportunityCount: cards.filter(
        (card) => card.analysis?.opportunityLevel === "high",
      ).length,
      pendingTaskCount: cards.flatMap((card) => card.followUpTasks).filter(
        (task) => task.status === "pending",
      ).length,
      trendSignalCount: trends.rawCount,
      overdueTaskCount: autopilot.metrics.overdueCount,
      dueTodayCount: autopilot.metrics.dueTodayCount,
      reminderDueCount: autopilot.metrics.reminderDueCount,
    },
    autopilot,
  };
}

export function getDemoFollowUpAutopilotData() {
  return getDemoDashboardData().autopilot;
}

export function getDemoTrendsData() {
  return buildTrendSummaries(getDemoConversationDetails());
}

export function getDemoCaptureTargets() {
  const details = getDemoConversationDetails();

  return {
    featuredConversation: details[1],
    supportedInsights: [
      "client preferences",
      "fabric mentions",
      "color mentions",
      "design ideas",
      "pricing discussion",
      "possible orders",
      "machinery opportunities",
      "sourcing opportunities",
      "marketing strategy suggestions",
      "sales strategy suggestions",
      "follow-up tasks",
      "deadlines",
      "client concerns",
      "new opportunities",
    ],
  };
}
