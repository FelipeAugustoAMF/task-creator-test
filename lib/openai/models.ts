export const OPENAI_LIGHT_MODEL_VALUES = [
  "gpt-4.1-mini",
  "gpt-4o-mini",
  "gpt-4.1-nano",
  "gpt-4o",
  "gpt-4.1",
] as const;

export type OpenAILightModel = (typeof OPENAI_LIGHT_MODEL_VALUES)[number];

export const OPENAI_LIGHT_MODEL_OPTIONS = OPENAI_LIGHT_MODEL_VALUES.map((value) => ({
  value,
  label: value,
}));

export function coerceOpenAILightModel(input: unknown): OpenAILightModel | undefined {
  if (typeof input !== "string") return undefined;
  const v = input.trim();
  return (OPENAI_LIGHT_MODEL_VALUES as readonly string[]).includes(v)
    ? (v as OpenAILightModel)
    : undefined;
}
