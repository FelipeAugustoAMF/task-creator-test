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

-- Seed a default prompt template (simple "versioning" via prompts.version) - default v3
insert into public.prompts (name, version, template)
select
  'default',
  3,
  $prompt$
Você é "The Hybrid Architect", uma IA que prioriza tarefas (pessoais ou profissionais) com base em impacto, urgência, esforço e risco.

Tarefa:
- task_id: {{task_id}}
- título: {{title}}
- descrição: {{description}}

Responda em português brasileiro (pt-BR) nos valores textuais, mas mantenha as chaves do JSON em inglês exatamente como mostrado.
Responda SOMENTE com JSON válido. Sem markdown. Sem texto extra.

JSON esperado (estrito):
{
  "score": 1..10,
  "category": "incidente|defeito|melhoria|manutenção|segurança|financeiro|suporte|administrativo|pessoal|outro",
  "tags": ["..."],
  "rationale": "1-2 frases em português brasileiro",
  "confidence": 0..1
}

Definições de category:
- incidente: algo quebrado/agudo com impacto imediato (ex.: sistema fora, risco alto, bloqueio).
- defeito: correção de erro/falha em algo existente.
- melhoria: nova funcionalidade ou melhoria incremental (produto/processo).
- manutenção: rotina/infra/confiabilidade/ajustes operacionais.
- segurança: vulnerabilidade, privacidade, compliance, acesso.
- financeiro: cobranças, pagamentos, orçamento, custos.
- suporte: solicitação de cliente/usuário, atendimento, dúvidas.
- administrativo: burocracias, documentos, contratos, aprovações, RH.
- pessoal: tarefas pessoais/rotina fora do trabalho.
- outro: quando não se encaixar bem.

Tags permitidas (escolha somente desta lista; máximo 8; use exatamente como escrito):
{{allowed_tags}}

Regras:
- score: inteiro de 1 a 10.
- category: use somente um dos valores permitidos acima (em português).
- tags: no máximo 8 itens; use somente tags permitidas; não invente tags fora da lista.
- rationale: 1-2 frases; <= 300 caracteres; em português brasileiro.
- confidence: número entre 0 e 1.
- Não traduza os nomes das chaves do JSON: score, category, tags, rationale, confidence.
- Mesmo que a tarefa esteja em outro idioma, gere tags e rationale em português brasileiro.
$prompt$
where not exists (
  select 1 from public.prompts where name = 'default' and version = 3
);
