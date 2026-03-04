"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createTaskAndScore } from "@/lib/tasks/service";
import { TaskRow } from "@/lib/tasks/types";

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10000),
});

export type CreateTaskActionResult =
  | { ok: true; task: TaskRow }
  | { ok: false; taskId?: string; message: string };

export async function createTaskAction(input: {
  title: string;
  description: string;
}): Promise<CreateTaskActionResult> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid input" };
  }

  const result = await createTaskAndScore(parsed.data);
  if (!result.ok) {
    return { ok: false, taskId: result.taskId, message: result.message };
  }

  revalidatePath("/dashboard");
  return { ok: true, task: result.task };
}

