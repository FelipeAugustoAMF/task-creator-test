export const SCORING_CATEGORY_VALUES = [
  "incidente",
  "defeito",
  "melhoria",
  "manutenção",
  "segurança",
  "financeiro",
  "suporte",
  "administrativo",
  "pessoal",
  "outro",
] as const;

export type ScoringCategory = (typeof SCORING_CATEGORY_VALUES)[number];

export const SCORING_CATEGORY_LABELS: Record<ScoringCategory, string> = {
  incidente: "Incidente",
  defeito: "Defeito",
  melhoria: "Melhoria",
  manutenção: "Manutenção",
  segurança: "Segurança",
  financeiro: "Financeiro",
  suporte: "Suporte",
  administrativo: "Administrativo",
  pessoal: "Pessoal",
  outro: "Outro",
};

export const ALLOWED_TAG_VALUES = [
  "urgente",
  "bloqueante",
  "prazo-curto",
  "prazo-longo",
  "alto-impacto",
  "medio-impacto",
  "baixo-impacto",
  "alto-risco",
  "baixo-risco",
  "baixo-esforco",
  "medio-esforco",
  "alto-esforco",
  "cliente",
  "interno",
  "regulatorio",
  "recorrente",
  "estrategico",
  "dependencia",
  "ganho-rapido",
] as const;

export type AllowedTag = (typeof ALLOWED_TAG_VALUES)[number];

export const ALLOWED_TAG_LABELS: Record<AllowedTag, string> = {
  urgente: "Urgente",
  bloqueante: "Bloqueante",
  "prazo-curto": "Prazo curto",
  "prazo-longo": "Prazo longo",
  "alto-impacto": "Alto impacto",
  "medio-impacto": "Médio impacto",
  "baixo-impacto": "Baixo impacto",
  "alto-risco": "Alto risco",
  "baixo-risco": "Baixo risco",
  "baixo-esforco": "Baixo esforço",
  "medio-esforco": "Esforço médio",
  "alto-esforco": "Alto esforço",
  cliente: "Cliente",
  interno: "Interno",
  regulatorio: "Regulatório",
  recorrente: "Recorrente",
  estrategico: "Estratégico",
  dependencia: "Dependência",
  "ganho-rapido": "Ganho rápido",
};

export const ALLOWED_TAG_OPTIONS = ALLOWED_TAG_VALUES.map((value) => ({
  value,
  label: ALLOWED_TAG_LABELS[value],
}));

function normalizeKey(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

const allowedTagByNormalized = new Map<string, AllowedTag>(
  ALLOWED_TAG_VALUES.map((t) => [normalizeKey(t), t]),
);

const tagSynonyms: Record<string, AllowedTag> = {
  bloqueio: "bloqueante",
  bloqueador: "bloqueante",
  bloqueante: "bloqueante",
  urgencia: "urgente",
  urgente: "urgente",
  regulatorio: "regulatorio",
  compliance: "regulatorio",
  regulamentar: "regulatorio",
  dependencia: "dependencia",
  dependencias: "dependencia",
  "alto-impacto": "alto-impacto",
  "medio-impacto": "medio-impacto",
  "baixo-impacto": "baixo-impacto",
  "impacto-medio": "medio-impacto",
  "alto-risco": "alto-risco",
  "baixo-risco": "baixo-risco",
  "baixo-esforco": "baixo-esforco",
  "medio-esforco": "medio-esforco",
  "alto-esforco": "alto-esforco",
  "esforco-medio": "medio-esforco",
  "prazo-curto": "prazo-curto",
  "prazo-longo": "prazo-longo",
  "quick-win": "ganho-rapido",
  "ganho-rapido": "ganho-rapido",
};

export function coerceAllowedTag(input: string): AllowedTag | null {
  const normalized = normalizeKey(input);
  return allowedTagByNormalized.get(normalized) ?? tagSynonyms[normalized] ?? null;
}

export function formatAllowedTagsForPrompt() {
  return ALLOWED_TAG_VALUES.map((t) => `- ${t}`).join("\n");
}
