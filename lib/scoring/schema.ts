import { z } from "zod";

export const scoringCategoryValues = [
  "incident",
  "bug",
  "feature",
  "ops",
  "finance",
  "support",
  "other",
] as const;

export type ScoringCategory = (typeof scoringCategoryValues)[number];

const rawScoringOutputSchema = z.object({
  score: z.coerce.number(),
  category: z.coerce.string(),
  tags: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .default([]),
  rationale: z.coerce.string(),
  confidence: z.coerce.number(),
});

export type RawScoringOutput = z.infer<typeof rawScoringOutputSchema>;

export type ScoringOutput = {
  score: number; // 1..10 (clamped)
  category: ScoringCategory;
  tags: string[];
  rationale: string;
  confidence: number; // 0..1 (clamped)
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeTags(input: unknown): string[] {
  const items: string[] = Array.isArray(input)
    ? input.map((t) => String(t))
    : typeof input === "string"
      ? input.split(/[,\n]/g)
      : [];

  const deduped = new Set<string>();
  for (const tag of items) {
    const cleaned = tag.trim().replace(/\s+/g, " ");
    if (!cleaned) continue;
    deduped.add(cleaned.slice(0, 32));
    if (deduped.size >= 8) break;
  }

  return Array.from(deduped);
}

function normalizeCategory(input: string): ScoringCategory {
  const cleaned = input.trim().toLowerCase();
  if ((scoringCategoryValues as readonly string[]).includes(cleaned)) {
    return cleaned as ScoringCategory;
  }
  return "other";
}

function normalizeRationale(input: string): string {
  const cleaned = input.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 300) return cleaned;
  return cleaned.slice(0, 300);
}

export function parseAndNormalizeScoringOutput(json: unknown): ScoringOutput {
  const parsed = rawScoringOutputSchema.parse(json);

  const score = clampNumber(Math.round(parsed.score), 1, 10);
  const confidence = clampNumber(parsed.confidence, 0, 1);

  return {
    score,
    category: normalizeCategory(parsed.category),
    tags: normalizeTags(parsed.tags),
    rationale: normalizeRationale(parsed.rationale),
    confidence,
  };
}

