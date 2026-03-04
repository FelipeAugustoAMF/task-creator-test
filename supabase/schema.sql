-- Minimal schema for "The Hybrid Architect (AI-Priority Middleware)" MVP
-- Tables: tasks, prompts, scoring_runs

create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  status text not null,
  score smallint null,
  category text null,
  tags text[] not null default '{}'::text[],
  rationale text null,
  confidence numeric null,
  created_at timestamptz not null default now(),
  constraint tasks_status_check check (status in ('done', 'failed')),
  constraint tasks_score_check check (score is null or (score >= 1 and score <= 10)),
  constraint tasks_confidence_check check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create index if not exists tasks_created_at_desc_idx on public.tasks (created_at desc);

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version integer not null,
  template text not null,
  created_at timestamptz not null default now()
);

create index if not exists prompts_name_version_idx on public.prompts (name, version);

create table if not exists public.scoring_runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  prompt_id uuid not null references public.prompts (id),
  provider text not null default 'openai',
  model text not null,
  prompt_version integer not null,
  rendered_prompt text not null,
  raw_response text not null,
  parsed_output jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists scoring_runs_task_id_idx on public.scoring_runs (task_id);

-- Seed a default prompt template (simple "versioning" via prompts.version)
insert into public.prompts (name, version, template)
select
  'default',
  1,
  $prompt$
You are "The Hybrid Architect", an AI that prioritizes tasks for a software team.

Task:
- task_id: {{task_id}}
- title: {{title}}
- description: {{description}}

Return ONLY valid JSON. No markdown. No extra text.

Output JSON (strict):
{
  "score": 1..10,
  "category": "incident|bug|feature|ops|finance|support|other",
  "tags": ["..."],
  "rationale": "1-2 frases",
  "confidence": 0..1
}

Rules:
- score must be an integer from 1 to 10.
- tags: max 8 items, short strings (no sentences).
- rationale: 1-2 sentences, <= 300 chars.
- confidence: number between 0 and 1.
$prompt$
where not exists (
  select 1 from public.prompts where name = 'default' and version = 1
);

