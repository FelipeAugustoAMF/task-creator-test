import "server-only";

import { coerceOpenAILightModel } from "@/lib/openai/models";
import {
  DEFAULT_PROMPT_NAME,
  DEFAULT_PROMPT_TEMPLATE,
  DEFAULT_PROMPT_VERSION,
} from "@/lib/scoring/defaultPrompt";
import { renderPrompt } from "@/lib/scoring/prompt";
import { scoreTaskWithOpenAI } from "@/lib/scoring/scoreTask";
import { formatAllowedTagsForPrompt } from "@/lib/scoring/taxonomy";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  DEFAULT_TASK_SORT_BY,
  DEFAULT_TASK_SORT_DIR,
  TaskSortBy,
  TaskSortDir,
} from "@/lib/tasks/query";
import {
  PromptRow,
  ScoringRunRow,
  ScoringRunTaskRef,
  ScoringRunWithTaskRow,
  TaskRow,
} from "@/lib/tasks/types";

export type CreateTaskInput = {
  title: string;
  description: string;
  model?: string;
};

export type CreateTaskResult =
  | { ok: true; task: TaskRow }
  | { ok: false; taskId: string; message: string };

async function getOrSeedDefaultPrompt(
  supabase: ReturnType<typeof getSupabaseAdmin>,
): Promise<PromptRow> {
  const { data: prompt, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("name", DEFAULT_PROMPT_NAME)
    .order("version", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const typedPrompt = (prompt as PromptRow | null) ?? null;
  if (typedPrompt && typedPrompt.version >= DEFAULT_PROMPT_VERSION) return typedPrompt;

  const { data: seededPrompt, error: seedError } = await supabase
    .from("prompts")
    .insert({
      name: DEFAULT_PROMPT_NAME,
      version: DEFAULT_PROMPT_VERSION,
      template: DEFAULT_PROMPT_TEMPLATE,
    })
    .select("*")
    .single();

  if (seedError || !seededPrompt) {
    throw new Error(seedError?.message || 'Falha ao criar o prompt "default"');
  }

  return seededPrompt as PromptRow;
}

export async function createTaskAndScore(input: CreateTaskInput): Promise<CreateTaskResult> {
  const supabase = getSupabaseAdmin();

  const { data: insertedTask, error: insertError } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      description: input.description,
      status: "failed",
      tags: [],
      is_completed: false,
    })
    .select("*")
    .single();

  if (insertError || !insertedTask) {
    return {
      ok: false,
      taskId: "unknown",
      message: insertError?.message || "Falha ao inserir tarefa",
    };
  }

  const taskId = insertedTask.id;

  let typedPrompt: PromptRow;
  try {
    typedPrompt = await getOrSeedDefaultPrompt(supabase);
  } catch (error) {
    return {
      ok: false,
      taskId,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  const allowedTags = formatAllowedTagsForPrompt();

  let renderedPrompt = renderPrompt(typedPrompt.template, {
    task_id: taskId,
    title: input.title,
    description: input.description,
    allowed_tags: allowedTags,
  });

  if (!typedPrompt.template.includes("{{allowed_tags}}")) {
    renderedPrompt = `${renderedPrompt}\n\nTags permitidas (escolha somente desta lista; máximo 8; use exatamente como escrito):\n${allowedTags}`;
  }

  const model = coerceOpenAILightModel(input.model);
  const scoreResult = await scoreTaskWithOpenAI({ renderedPrompt, model });

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
      message: `Falha ao inserir log de scoring: ${runError.message}`,
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
      message:
        updateError?.message ||
        "Falha ao atualizar a tarefa com o resultado do scoring",
    };
  }

  return { ok: true, task: updatedTask };
}

export type ListTasksParams = {
  page: number;
  pageSize: number;
  completed?: boolean;
  scoreMin?: number;
  scoreMax?: number;
  category?: string;
  search?: string;
  from?: string;
  to?: string;
  tags?: string[];
  sortBy?: TaskSortBy;
  sortDir?: TaskSortDir;
};

function toIsoBoundary(value: string, boundary: "start" | "end") {
  const v = value.trim();
  if (!v) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return boundary === "start" ? `${v}T00:00:00.000Z` : `${v}T23:59:59.999Z`;
  }

  return v;
}

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

  if (typeof params.completed === "boolean") {
    query = query.eq("is_completed", params.completed);
  }

  if (typeof params.scoreMin === "number" && Number.isFinite(params.scoreMin)) {
    query = query.gte("score", params.scoreMin);
  }

  if (typeof params.scoreMax === "number" && Number.isFinite(params.scoreMax)) {
    query = query.lte("score", params.scoreMax);
  }

  if (params.tags?.length) {
    query = query.overlaps("tags", params.tags.slice(0, 20));
  }

  if (params.from) {
    const fromIso = toIsoBoundary(params.from, "start");
    if (fromIso) query = query.gte("created_at", fromIso);
  }

  if (params.to) {
    const toIso = toIsoBoundary(params.to, "end");
    if (toIso) query = query.lte("created_at", toIso);
  }

  const sortBy = params.sortBy ?? DEFAULT_TASK_SORT_BY;
  const sortDir = params.sortDir ?? DEFAULT_TASK_SORT_DIR;
  const ascending = sortDir === "asc";

  if (sortBy === "score") {
    query = query
      .order("score", { ascending, nullsFirst: false })
      .order("created_at", { ascending: false });
  } else if (sortBy === "title") {
    query = query.order("title", { ascending }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending });
  }

  const { data, error, count } = await query.range(fromIndex, toIndex);

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

export type UpdateTaskInput = {
  id: string;
  title: string;
  description: string;
};

export async function updateTask(input: UpdateTaskInput): Promise<TaskRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tasks")
    .update({ title: input.title, description: input.description })
    .eq("id", input.id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as TaskRow | null) ?? null;
}

export async function setTaskCompleted(params: {
  id: string;
  isCompleted: boolean;
}): Promise<TaskRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tasks")
    .update({ is_completed: params.isCompleted })
    .eq("id", params.id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as TaskRow | null) ?? null;
}

export async function deleteTaskById(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data.length > 0 : Boolean(data);
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

export type ListScoringRunsParams = {
  page: number;
  pageSize: number;
  from?: string;
  to?: string;
  model?: string;
};

export async function listScoringRuns(params: ListScoringRunsParams): Promise<{
  items: ScoringRunWithTaskRow[];
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

  let query = supabase.from("scoring_runs").select(
    "id, task_id, prompt_id, provider, model, prompt_version, rendered_prompt, raw_response, parsed_output, created_at, task:tasks(id, title)",
    { count: "exact" },
  );

  if (params.from) {
    const fromIso = toIsoBoundary(params.from, "start");
    if (fromIso) query = query.gte("created_at", fromIso);
  }

  if (params.to) {
    const toIso = toIsoBoundary(params.to, "end");
    if (toIso) query = query.lte("created_at", toIso);
  }

  if (params.model) {
    query = query.eq("model", params.model);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(fromIndex, toIndex);

  if (error) throw new Error(error.message);

  const items = ((data ?? []) as Array<
    Omit<ScoringRunWithTaskRow, "task"> & { task?: unknown }
  >).map((run) => {
    const embeddedTask = run.task;
    const task = Array.isArray(embeddedTask)
      ? ((embeddedTask[0] as ScoringRunTaskRef | undefined) ?? null)
      : embeddedTask && typeof embeddedTask === "object"
        ? (embeddedTask as ScoringRunTaskRef)
        : null;

    return { ...(run as Omit<ScoringRunWithTaskRow, "task">), task };
  });

  return { items, total: count ?? 0 };
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
