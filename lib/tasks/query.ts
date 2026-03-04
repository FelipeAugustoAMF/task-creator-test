export const TASK_SORT_BY_VALUES = ["created_at", "score", "title"] as const;
export type TaskSortBy = (typeof TASK_SORT_BY_VALUES)[number];

export type TaskSortDir = "asc" | "desc";

export const DEFAULT_TASK_SORT_BY: TaskSortBy = "created_at";
export const DEFAULT_TASK_SORT_DIR: TaskSortDir = "desc";

export function coerceTaskSortBy(input: unknown): TaskSortBy | undefined {
  if (typeof input !== "string") return undefined;
  const value = input.trim();
  return (TASK_SORT_BY_VALUES as readonly string[]).includes(value)
    ? (value as TaskSortBy)
    : undefined;
}

export function coerceTaskSortDir(input: unknown): TaskSortDir | undefined {
  if (typeof input !== "string") return undefined;
  const value = input.trim().toLowerCase();
  return value === "asc" || value === "desc" ? (value as TaskSortDir) : undefined;
}

