import type { OpportunityLevel } from "@/lib/types";

export function normalizeOpportunityLevel(value: string): OpportunityLevel {
  const normalized = value.trim().toLowerCase();

  if (normalized === "high") return "high";
  if (normalized === "medium" || normalized === "med") return "medium";
  return "low";
}
