import { z } from "zod";

import { opportunityLevels } from "@/lib/types";
import { normalizeOpportunityLevel } from "@/lib/transforms/opportunity";

export const analysisTaskSchema = z.object({
  task: z.string().min(1).trim(),
  dueDate: z.string().trim().nullable().default(null),
});

export const aiAnalysisSchema = z.object({
  summary: z.string().min(1).trim(),
  importantBusinessPoints: z.array(z.string().trim()).default([]),
  clientPreferences: z.array(z.string().trim()).default([]),
  designIdeas: z.array(z.string().trim()).default([]),
  fabricMentions: z.array(z.string().trim()).default([]),
  colorMentions: z.array(z.string().trim()).default([]),
  patternStyleMentions: z.array(z.string().trim()).default([]),
  marketTrendInsights: z.array(z.string().trim()).default([]),
  pricingDiscussion: z.array(z.string().trim()).default([]),
  possibleOrders: z.array(z.string().trim()).default([]),
  followUpTasks: z.array(analysisTaskSchema).default([]),
  deadlines: z.array(z.string().trim()).default([]),
  clientConcerns: z.array(z.string().trim()).default([]),
  newOpportunities: z.array(z.string().trim()).default([]),
  machineryOpportunities: z.array(z.string().trim()).default([]),
  sourcingOpportunities: z.array(z.string().trim()).default([]),
  marketingStrategySuggestions: z.array(z.string().trim()).default([]),
  salesStrategySuggestions: z.array(z.string().trim()).default([]),
  ignoredCasualTalk: z.array(z.string().trim()).default([]),
  opportunityLevel: z
    .string()
    .transform(normalizeOpportunityLevel)
    .pipe(z.enum(opportunityLevels)),
  nextAction: z.string().min(1).trim(),
});

const stringListSchema = {
  type: "array",
  items: {
    type: "string",
  },
} as const;

export const aiAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
      description: "One concise summary of the business-relevant conversation outcome.",
    },
    importantBusinessPoints: {
      ...stringListSchema,
      description: "Concrete commercial decisions, quantities, constraints, or important asks.",
    },
    clientPreferences: {
      ...stringListSchema,
      description: "Client preferences about quality, style, feel, use case, or buying behavior.",
    },
    designIdeas: {
      ...stringListSchema,
      description: "Design directions, silhouettes, collections, or product concepts mentioned.",
    },
    fabricMentions: {
      ...stringListSchema,
      description: "Fabrics, materials, blends, trims, or surface treatments mentioned.",
    },
    colorMentions: {
      ...stringListSchema,
      description: "Colors, palettes, tones, or color families mentioned in the discussion.",
    },
    patternStyleMentions: {
      ...stringListSchema,
      description: "Patterns, prints, embroidery, motifs, cuts, or style cues mentioned.",
    },
    marketTrendInsights: {
      ...stringListSchema,
      description: "Signals about demand, buying behavior, or broader market trends.",
    },
    pricingDiscussion: {
      ...stringListSchema,
      description: "Any pricing expectations, margins, negotiation points, or budget concerns.",
    },
    possibleOrders: {
      ...stringListSchema,
      description: "Potential sample requests, trial orders, repeat orders, or collection opportunities.",
    },
    followUpTasks: {
      type: "array",
      description: "Actionable follow-up tasks extracted from the conversation.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          task: {
            type: "string",
            description: "Short, actionable next step.",
          },
          dueDate: {
            type: ["string", "null"],
            description:
              "Use YYYY-MM-DD when the deadline is clear enough to schedule, otherwise null.",
          },
        },
        required: ["task", "dueDate"],
      },
    },
    deadlines: {
      ...stringListSchema,
      description: "Important deadlines or time phrases that should remain visible for review.",
    },
    clientConcerns: {
      ...stringListSchema,
      description: "Risks, objections, worries, blockers, or hesitation from the client.",
    },
    newOpportunities: {
      ...stringListSchema,
      description: "Upsell, reorder, line extension, or business growth opportunities.",
    },
    machineryOpportunities: {
      ...stringListSchema,
      description:
        "Specific machinery, equipment, production capability, or process-upgrade opportunities mentioned.",
    },
    sourcingOpportunities: {
      ...stringListSchema,
      description:
        "Supplier, mill, sourcing-country, material, or procurement opportunities mentioned.",
    },
    marketingStrategySuggestions: {
      ...stringListSchema,
      description:
        "Suggestions about marketing direction, channel mix, physical outreach, branding, or campaign approach.",
    },
    salesStrategySuggestions: {
      ...stringListSchema,
      description:
        "Suggestions about sales motion, distribution, order strategy, channel approach, or commercial positioning.",
    },
    ignoredCasualTalk: {
      ...stringListSchema,
      description: "Casual or irrelevant talk intentionally excluded from core business insight.",
    },
    opportunityLevel: {
      type: "string",
      enum: [...opportunityLevels],
      description: "Overall opportunity level. Must be low, medium, or high.",
    },
    nextAction: {
      type: "string",
      description: "The single most important next action for the owner to take.",
    },
  },
  required: [
    "summary",
    "importantBusinessPoints",
    "clientPreferences",
    "designIdeas",
    "fabricMentions",
    "colorMentions",
    "patternStyleMentions",
    "marketTrendInsights",
    "pricingDiscussion",
    "possibleOrders",
    "followUpTasks",
    "deadlines",
    "clientConcerns",
    "newOpportunities",
    "machineryOpportunities",
    "sourcingOpportunities",
    "marketingStrategySuggestions",
    "salesStrategySuggestions",
    "ignoredCasualTalk",
    "opportunityLevel",
    "nextAction",
  ],
} as const;

export type AiAnalysisInput = z.infer<typeof aiAnalysisSchema>;

export function parseAiAnalysis(value: unknown) {
  return aiAnalysisSchema.parse(value);
}
