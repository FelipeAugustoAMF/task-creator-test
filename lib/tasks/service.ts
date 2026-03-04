import "server-only";

import { renderPrompt } from "@/lib/scoring/prompt";
import { scoreTaskWithOpenAI } from "@/lib/scoring/scoreTask";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { PromptRow, ScoringRunRow, TaskRow } from "@/lib/tasks/types";

export type CreateTaskInput = {
  title: string;
  description: string;
};

export type CreateTaskResult =
  | { ok: true; task: TaskRow }
  | { ok: false; taskId: string; message: string };

export async function createTaskAndScore(input: CreateTaskInput): Promise<CreateTaskResult> {
  const supabase = getSupabaseAdmin();

  const { data: insertedTask, error: insertError } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      description: input.description,
      status: "failed",
      tags: [],
    })
    .select("*")
    .single();

  if (insertError || !insertedTask) {
    return {
      ok: false,
      taskId: "unknown",
      message: insertError?.message || "Failed to insert task",
    };
  }

  const taskId = insertedTask.id;

  const { data: prompt, error: promptError } = await supabase
    .from("prompts")
    .select("*")
    .eq("name", "default")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (promptError || !prompt) {
    return {
      ok: false,
      taskId,
      message: promptError?.message || 'Missing prompt "default"',
    };
  }

  const typedPrompt = prompt as PromptRow;

  const renderedPrompt = renderPrompt(typedPrompt.template, {
    task_id: taskId,
    title: input.title,
    description: input.description,
  });

  const scoreResult = await scoreTaskWithOpenAI({ renderedPrompt });

  const scoringRunInsert = {
    task_id: taskId,
    prompt_id: typedPrompt.id,
    provider: "openai",
    model: scoreResult.model,
    prompt_version: typedPrompt.version,
    rendered_prompt: scoreResult.usedPrompt,
    raw_response: scoreResult.rawResponse,
    parsed_output: scoreResult.ok ? scoreResult.parsed : null,
  } satisfies Partial<ScoringRunRow>;

  const { error: runError } = await supabase
    .from("scoring_runs")
    .insert(scoringRunInsert);

  if (runError) {
    return {
      ok: false,
      taskId,
      message: `Failed to insert scoring run: ${runError.message}`,
    };
  }

  if (!scoreResult.ok) {
    return { ok: false, taskId, message: scoreResult.error };
  }

  const { data: updatedTask, error: updateError } = await supabase
    .from("tasks")
    .update({
      status: "done",
      score: scoreResult.parsed.score,
      category: scoreResult.parsed.category,
      tags: scoreResult.parsed.tags,
      rationale: scoreResult.parsed.rationale,
      confidence: scoreResult.parsed.confidence,
    })
    .eq("id", taskId)
    .select("*")
    .single();

  if (updateError || !updatedTask) {
    return {
      ok: false,
      taskId,
      message: updateError?.message || "Failed to update task with scoring output",
    };
  }

  return { ok: true, task: updatedTask };
}

export type ListTasksParams = {
  page: number;
  pageSize: number;
  scoreMin?: number;
  scoreMax?: number;
  category?: string;
  search?: string;
  from?: string;
  to?: string;
};

export async function listTasks(params: ListTasksParams): Promise<{
  items: TaskRow[];
  total: number;
}> {
  const supabase = getSupabaseAdmin();
  const safePage = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
  const safePageSize =
    Number.isFinite(params.pageSize) && params.pageSize > 0
      ? Math.min(params.pageSize, 100)
      : 20;

  const fromIndex = (safePage - 1) * safePageSize;
  const toIndex = fromIndex + safePageSize - 1;

  let query = supabase.from("tasks").select("*", { count: "exact" });

  if (params.search) {
    const s = params.search.trim().slice(0, 200);
    if (s) {
      const pattern = `%${s.replaceAll("%", "\\%")}%`;
      if (/[(),]/.test(s)) {
        query = query.ilike("title", pattern);
      } else {
        query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`);
      }
    }
  }

  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (typeof params.scoreMin === "number" && Number.isFinite(params.scoreMin)) {
    query = query.gte("score", params.scoreMin);
  }

  if (typeof params.scoreMax === "number" && Number.isFinite(params.scoreMax)) {
    query = query.lte("score", params.scoreMax);
  }

  if (params.from) query = query.gte("created_at", params.from);
  if (params.to) query = query.lte("created_at", params.to);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(fromIndex, toIndex);

  if (error) {
    throw new Error(error.message);
  }

  return { items: (data as TaskRow[]) ?? [], total: count ?? 0 };
}

export async function getTaskById(id: string): Promise<TaskRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as TaskRow | null) ?? null;
}

export async function listTaskRuns(taskId: string): Promise<ScoringRunRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("scoring_runs")
    .select(
      "id, task_id, prompt_id, provider, model, prompt_version, rendered_prompt, raw_response, parsed_output, created_at",
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ScoringRunRow[]) ?? [];
}

export async function listPrompts(): Promise<PromptRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as PromptRow[]) ?? [];
}
