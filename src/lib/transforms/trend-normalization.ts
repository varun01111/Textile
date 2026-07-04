import type { AiAnalysis, TrendCategory, TrendMentionRecord } from "@/lib/types";
import { normalizeToken } from "@/lib/utils";

type SourceConfig = {
  category: TrendCategory;
  sourceField: keyof Pick<
    AiAnalysis,
    | "colorMentions"
    | "fabricMentions"
    | "designIdeas"
    | "patternStyleMentions"
    | "marketTrendInsights"
    | "clientConcerns"
    | "newOpportunities"
    | "machineryOpportunities"
    | "sourcingOpportunities"
    | "marketingStrategySuggestions"
    | "salesStrategySuggestions"
  >;
};

const trendSourceMap: SourceConfig[] = [
  { category: "color", sourceField: "colorMentions" },
  { category: "fabric", sourceField: "fabricMentions" },
  { category: "design", sourceField: "designIdeas" },
  { category: "pattern_style", sourceField: "patternStyleMentions" },
  { category: "market_trend", sourceField: "marketTrendInsights" },
  { category: "concern", sourceField: "clientConcerns" },
  { category: "opportunity", sourceField: "newOpportunities" },
  { category: "machinery", sourceField: "machineryOpportunities" },
  { category: "sourcing", sourceField: "sourcingOpportunities" },
  { category: "marketing_strategy", sourceField: "marketingStrategySuggestions" },
  { category: "sales_strategy", sourceField: "salesStrategySuggestions" },
];

export function buildTrendMentions(
  conversationId: string,
  analysis: AiAnalysis,
): Array<Omit<TrendMentionRecord, "id" | "createdAt">> {
  return trendSourceMap.flatMap(({ category, sourceField }) =>
    analysis[sourceField]
      .map((label) => ({
        conversationId,
        category,
        label,
        normalizedValue: normalizeToken(label),
        mentionCount: 1,
        sourceField,
      }))
      .filter((item) => item.normalizedValue.length > 0),
  );
}
