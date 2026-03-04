export type TaskStatus = "done" | "failed";

export type TaskRow = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  score: number | null;
  category: string | null;
  tags: string[];
  rationale: string | null;
  confidence: number | null;
  created_at: string;
};

export type PromptRow = {
  id: string;
  name: string;
  version: number;
  template: string;
  created_at: string;
};

export type ScoringRunRow = {
  id: string;
  task_id: string;
  prompt_id: string;
  provider: string;
  model: string;
  prompt_version: number;
  rendered_prompt: string;
  raw_response: string;
  parsed_output: unknown | null;
  created_at: string;
};

export type ScoringRunTaskRef = { id: string; title: string };

export type ScoringRunWithTaskRow = ScoringRunRow & {
  task: ScoringRunTaskRef | null;
};
