"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { coerceOpenAILightModel } from "@/lib/openai/models";
import { createTaskAndScore } from "@/lib/tasks/service";
import { TaskRow } from "@/lib/tasks/types";

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10000),
  model: z.string().trim().optional(),
});

export type CreateTaskActionResult =
  | { ok: true; task: TaskRow }
  | { ok: false; taskId?: string; message: string };

export async function createTaskAction(input: {
  title: string;
  description: string;
  model?: string;
}): Promise<CreateTaskActionResult> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Entrada inválida" };
  }

  const model = coerceOpenAILightModel(parsed.data.model);
  if (parsed.data.model && !model) {
    return { ok: false, message: "Modelo inválido" };
  }

  const result = await createTaskAndScore({ ...parsed.data, model });
  if (!result.ok) {
    return { ok: false, taskId: result.taskId, message: result.message };
  }

  revalidatePath("/dashboard");
  return { ok: true, task: result.task };
}
