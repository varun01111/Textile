import type {
  AiAnalysis,
  ConversationSourceLanguage,
  ConversationRecord,
  TranscriptRecord,
} from "@/lib/types";

export function buildMockTranscript(
  conversation: ConversationRecord,
  sourceLanguage: ConversationSourceLanguage = "auto",
): Omit<TranscriptRecord, "id" | "createdAt" | "updatedAt"> {
  const gujaratiTranscript = {
    fullTranscript: `${conversation.clientName} sathe vaat ma halki cotton-linen blend, terracotta ane sage shades, festive co-ord sample, bulk pricing pressure, ane agal na Friday sudhi sample board mokalvani vaat thai. Client e navi embroidery machinery thi finishing improve thai shake ane offline buyer meetings par focus karvo joiye e pan sujhav aapo.`,
    detectedLanguage: "gu",
    rawSegments: [
      {
        speaker: "Speaker 1",
        startMs: 0,
        endMs: 9000,
        text: "Client kahe chhe ke breathable cotton-linen blend joiye ane terracotta-sage direction strong lage chhe.",
      },
      {
        speaker: "Speaker 2",
        startMs: 9000,
        endMs: 19000,
        text: `Teo kahe chhe ke premium finishing mate navi embroidery machinery joi shakay, pan bulk pricing control ma rehvi joiye for ${conversation.clientName}.`,
      },
      {
        speaker: "Speaker 1",
        startMs: 19000,
        endMs: 29000,
        text: "Agal na Friday sudhi sample board, quote, ane thodi physical buyer outreach strategy mokalvi chhe.",
      },
    ],
  };

  const englishTranscript = {
    fullTranscript: `${conversation.clientName} discussed lighter cotton blends, richer terracotta and sage tones, and a small trial order for festive embroidered co-ord sets. They also mentioned price sensitivity for bulk orders, a possible machinery upgrade to improve premium finishing, and a request to follow up with samples and pricing by next Friday.`,
    detectedLanguage: "en",
    rawSegments: [
      {
        speaker: "Speaker 1",
        startMs: 0,
        endMs: 8000,
        text: "We are seeing interest in breathable cotton-linen blends and clients are asking for softer festive palettes.",
      },
      {
        speaker: "Speaker 2",
        startMs: 8000,
        endMs: 17000,
        text: `For ${conversation.clientName}, the terracotta and sage direction feels strong. They want embroidery that looks premium but still keeps the margin healthy.`,
      },
      {
        speaker: "Speaker 1",
        startMs: 17000,
        endMs: 26000,
        text: "They are open to a trial order if we share swatches, a quote, and a plan for improving premium finishing by next Friday.",
      },
    ],
  };

  const transcript = sourceLanguage === "gujarati" ? gujaratiTranscript : englishTranscript;

  return {
    conversationId: conversation.id,
    fullTranscript: transcript.fullTranscript,
    detectedLanguage: transcript.detectedLanguage,
    transcriptProvider: "mock",
    rawSegments: transcript.rawSegments,
  };
}

export function buildMockAnalysis(): AiAnalysis {
  return {
    summary:
      "Client conversation centered on breathable festive sets, warm earth-tone colors, and a near-term sample follow-up that could convert into a trial order.",
    importantBusinessPoints: [
      "Client wants festive co-ord concepts with premium but cost-aware embroidery.",
      "A small trial order is possible after sample board review.",
    ],
    clientPreferences: [
      "Breathable cotton-linen blends",
      "Premium finish without aggressive price increase",
    ],
    designIdeas: [
      "Festive co-ord sets with subtle embroidery placement",
      "Soft drape silhouettes for occasion wear",
    ],
    fabricMentions: ["Cotton-linen blend", "Soft cotton sateen"],
    colorMentions: ["Terracotta", "Sage green", "Muted gold accents"],
    patternStyleMentions: ["Subtle floral embroidery", "Minimal motif placement"],
    marketTrendInsights: [
      "Clients are leaning toward breathable festive wear instead of heavy occasion pieces.",
    ],
    pricingDiscussion: [
      "Bulk order pricing needs to stay margin-conscious.",
      "Embroidery complexity should not push the sample beyond target range.",
    ],
    possibleOrders: ["Trial order for festive co-ord sample batch"],
    followUpTasks: [
      { task: "Share sample board with terracotta and sage options", dueDate: "Next Friday" },
      { task: "Send pricing estimate for embroidered co-ord set", dueDate: "Next Friday" },
    ],
    deadlines: ["Next Friday"],
    clientConcerns: ["Worried about embroidery cost affecting final pricing."],
    newOpportunities: [
      "Position breathable festive separates as a recurring capsule collection.",
    ],
    machineryOpportunities: [
      "Evaluate an embroidery machine setup that improves premium detailing without slowing sampling.",
    ],
    sourcingOpportunities: [
      "Compare cotton-linen sourcing options that keep festive hand-feel inside the target cost band.",
    ],
    marketingStrategySuggestions: [
      "Lead upcoming outreach with a breathable festive capsule story for boutique buyers and in-person presentations.",
    ],
    salesStrategySuggestions: [
      "Use a limited trial-order pitch first, then upsell into a repeat festive program after sample approval.",
    ],
    ignoredCasualTalk: ["General greetings and scheduling chatter."],
    opportunityLevel: "high",
    nextAction: "Prepare the sample board and send a pricing estimate before next Friday.",
  };
}
