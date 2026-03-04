import { z } from "zod";

import { coerceAllowedTag, SCORING_CATEGORY_VALUES } from "@/lib/scoring/taxonomy";

export const scoringCategoryValues = SCORING_CATEGORY_VALUES;

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
    const cleaned = tag.trim();
    if (!cleaned) continue;
    const allowed = coerceAllowedTag(cleaned);
    if (!allowed) continue;
    deduped.add(allowed);
    if (deduped.size >= 8) break;
  }

  return Array.from(deduped);
}

function normalizeCategory(input: string): ScoringCategory {
  const cleaned = input.trim().toLowerCase();

  const legacyMap: Record<string, ScoringCategory> = {
    incident: "incidente",
    bug: "defeito",
    feature: "melhoria",
    ops: "manutenção",
    finance: "financeiro",
    support: "suporte",
    other: "outro",

    // Common pt-BR variants without accents
    manutencao: "manutenção",
    seguranca: "segurança",

    // Synonyms
    erro: "defeito",
    falha: "defeito",
    correcao: "defeito",
    correção: "defeito",
  };

  const candidate = legacyMap[cleaned] ?? cleaned;

  if ((scoringCategoryValues as readonly string[]).includes(candidate)) {
    return candidate as ScoringCategory;
  }

  return "outro";
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
