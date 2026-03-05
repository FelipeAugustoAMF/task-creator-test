"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { coerceOpenAILightModel } from "@/lib/openai/models";
import { createTaskAndScore, deleteTaskById, updateTask } from "@/lib/tasks/service";
import { TaskRow } from "@/lib/tasks/types";

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10000),
  model: z.string().trim().optional(),
});

const updateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10000),
});

const deleteTaskSchema = z.object({
  id: z.string().uuid(),
});

export type CreateTaskActionResult =
  | { ok: true; task: TaskRow }
  | { ok: false; taskId?: string; message: string };

export type UpdateTaskActionResult =
  | { ok: true; task: TaskRow }
  | { ok: false; message: string };

export type DeleteTaskActionResult =
  | { ok: true }
  | { ok: false; message: string };

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

export async function updateTaskAction(input: {
  id: string;
  title: string;
  description: string;
}): Promise<UpdateTaskActionResult> {
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Entrada invÃ¡lida" };
  }

  const updated = await updateTask(parsed.data);
  if (!updated) {
    return { ok: false, message: "NÃ£o encontrado" };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/tasks/${parsed.data.id}`);
  revalidatePath("/dashboard/logs");
  return { ok: true, task: updated };
}

export async function deleteTaskAction(input: { id: string }): Promise<DeleteTaskActionResult> {
  const parsed = deleteTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Entrada invÃ¡lida" };
  }

  const deleted = await deleteTaskById(parsed.data.id);
  if (!deleted) {
    return { ok: false, message: "NÃ£o encontrado" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/logs");
  return { ok: true };
}
