import "server-only";

import { getOpenAIClient } from "@/lib/openai/client";
import { parseAndNormalizeScoringOutput, ScoringOutput } from "@/lib/scoring/schema";

const outputJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "integer", minimum: 1, maximum: 10 },
    category: {
      type: "string",
      enum: [
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
      ],
    },
    tags: { type: "array", items: { type: "string" }, maxItems: 8 },
    rationale: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["score", "category", "tags", "rationale", "confidence"],
} as const;

export type ScoreTaskResult =
  | {
      ok: true;
      model: string;
      usedPrompt: string;
      rawResponse: string;
      parsed: ScoringOutput;
    }
  | {
      ok: false;
      model: string;
      usedPrompt: string;
      rawResponse: string;
      error: string;
    };

function getDefaultModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

async function createJsonTextResponse(params: {
  model: string;
  prompt: string;
}): Promise<string> {
  const client = getOpenAIClient();

  const anyClient = client as any;

  if (anyClient.responses?.create) {
    const response = await anyClient.responses.create({
      model: params.model,
      input: params.prompt,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "task_priority",
          strict: true,
          schema: outputJsonSchema,
        },
      },
    });

    const outputText = response?.output_text;
    if (typeof outputText !== "string") {
      throw new Error("OpenAI response is missing output_text");
    }
    return outputText.trim();
  }

  const completion = await anyClient.chat.completions.create({
    model: params.model,
    messages: [{ role: "user", content: params.prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI chat completion is missing message content");
  }
  return content.trim();
}

export async function scoreTaskWithOpenAI(params: {
  renderedPrompt: string;
  model?: string;
}): Promise<ScoreTaskResult> {
  const model = params.model || getDefaultModel();

  const attemptPrompts = [
    params.renderedPrompt,
    `${params.renderedPrompt}\n\nIMPORTANTE: Responda SOMENTE com JSON válido. JSON VÁLIDO APENAS. Sem markdown. Sem texto extra. Escreva os valores textuais em português brasileiro (pt-BR) e use 'category' em português (ex.: incidente, defeito, melhoria, manutenção, segurança, financeiro, suporte, administrativo, pessoal, outro).`,
  ];

  let lastRawResponse = "";
  let lastError = "";
  let usedPrompt = attemptPrompts[0]!;

  for (let attemptIndex = 0; attemptIndex < attemptPrompts.length; attemptIndex++) {
    usedPrompt = attemptPrompts[attemptIndex]!;

    try {
      const rawResponse = await createJsonTextResponse({ model, prompt: usedPrompt });
      lastRawResponse = rawResponse;

      const json = JSON.parse(rawResponse);
      const parsed = parseAndNormalizeScoringOutput(json);

      return { ok: true, model, usedPrompt, rawResponse, parsed };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attemptIndex === attemptPrompts.length - 1) break;
    }
  }

  return {
    ok: false,
    model,
    usedPrompt,
    rawResponse: lastRawResponse || lastError || "Unknown error",
    error: lastError || "Failed to score task",
  };
}
