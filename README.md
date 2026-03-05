# Criador de Tarefas — The Hybrid Architect (AI-Priority Middleware) — MVP

Este é apenas um pequeno MVP de teste feito com Next.js (App Router) + TypeScript + Supabase (Postgres) + OpenAI.

## ✅ O que este MVP faz

- Recebe tasks via API (`POST /api/tasks`) com `title` e `description`.
- Chama a **OpenAI** para gerar prioridade:
  - `score` (1..10), `category`, `tags`, `rationale`, `confidence` (0..1)
- Persiste tudo no Supabase (tabelas `tasks`, `prompts`, `scoring_runs`).
- Dashboard em `/dashboard` (login em `/login`):
  - lista + filtros (inclui status: pendentes/concluídas)
  - criação de nova task (síncrona) com escolha de modelo OpenAI
  - detalhe da task + aba com logs de prompt/response
  - editar/excluir tasks; marcar como concluída/pendente

## 1) Setup local

```bash
npm install
npm run dev
```

Abra `http://localhost:3000/login` (ou `http://localhost:3000/dashboard`, que redireciona para login).

## 2) Variáveis de ambiente

Crie um `.env.local` na raiz:

```bash
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4.1-mini"

APP_SESSION_SECRET="change-me"
APP_API_KEY="change-me"
```

Regras importantes:

- **Nunca** exponha `SUPABASE_SERVICE_ROLE_KEY`, `APP_API_KEY` ou `APP_SESSION_SECRET` no client.
- Endpoints `/api/*` deste MVP exigem `Authorization: Bearer <APP_API_KEY>`.
- O dashboard usa cookie de sessão assinado via `APP_SESSION_SECRET`.

## 3) Aplicar o schema no Supabase

1. Crie um projeto no Supabase.
2. Vá em **SQL Editor** e rode o arquivo `supabase/schema.sql`.

Esse script cria as tabelas, faz seed de um prompt `default` (version 1) e cria um usuário padrão para login (`admin/admin`).

### 3.1) (Opcional) Criar outro usuário de login

```sql
insert into public.app_users (username, password_hash)
values ('teste', crypt('teste', gen_salt('bf')))
on conflict (username) do nothing;
```

## 4) Testar endpoints (curl)

### 4.1) POST /api/tasks (cria e faz score síncrono)

**Bash/Zsh**

```bash
curl -X POST "http://localhost:3000/api/tasks" \
  -H "Authorization: Bearer $APP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Checkout quebrando","description":"Usuários não conseguem pagar. Erro 500 intermitente."}'
```

**PowerShell**

```powershell
$env:APP_API_KEY="change-me"
curl.exe -X POST "http://localhost:3000/api/tasks" `
  -H "Authorization: Bearer $env:APP_API_KEY" `
  -H "Content-Type: application/json" `
  -d "{\"title\":\"Checkout quebrando\",\"description\":\"Usuários não conseguem pagar. Erro 500 intermitente.\"}"
```

### 4.2) GET /api/tasks (lista paginada + filtros)

```bash
curl "http://localhost:3000/api/tasks?page=1&pageSize=20&category=defeito&scoreMin=7&search=checkout" \
  -H "Authorization: Bearer $APP_API_KEY"
```

Exemplo com filtros de data e tags:

```bash
curl "http://localhost:3000/api/tasks?page=1&pageSize=20&from=2026-03-01&to=2026-03-31&tags=urgente,bloqueante" \
  -H "Authorization: Bearer $APP_API_KEY"
```

Filtro de status: `completion=pending|completed`.

Ordenação: `sortBy=created_at|score|title` e `sortDir=asc|desc` (padrão: `created_at desc`).

### 4.3) GET /api/tasks/:id

```bash
curl "http://localhost:3000/api/tasks/<TASK_ID>" \
  -H "Authorization: Bearer $APP_API_KEY"
```

### 4.4) GET /api/tasks/:id/runs (logs de prompt/response)

```bash
curl "http://localhost:3000/api/tasks/<TASK_ID>/runs" \
  -H "Authorization: Bearer $APP_API_KEY"
```

### 4.5) (Opcional) GET /api/prompts

```bash
curl "http://localhost:3000/api/prompts" \
  -H "Authorization: Bearer $APP_API_KEY"
```

### 4.6) PATCH /api/tasks/:id (editar)

Atualiza parcialmente `title`, `description` e/ou `isCompleted`.

```bash
curl -X PATCH "http://localhost:3000/api/tasks/<TASK_ID>" \
  -H "Authorization: Bearer $APP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Novo título","isCompleted":true}'
```

### 4.7) DELETE /api/tasks/:id (excluir)

```bash
curl -X DELETE "http://localhost:3000/api/tasks/<TASK_ID>" \
  -H "Authorization: Bearer $APP_API_KEY"
```

## 5) Deploy na Vercel

1. Suba o projeto em um repositório Git.
2. Importe na Vercel.
3. Configure as env vars do `.env.local` em **Project Settings → Environment Variables**.
4. Deploy.

## Estrutura principal

- `app/api/**/route.ts`: Route Handlers (API protegida por `APP_API_KEY`)
- `app/dashboard/*`: dashboard (Mantine + Server Actions)
- `lib/scoring/*`: prompt rendering + parsing + guardrails + chamada OpenAI
- `supabase/schema.sql`: DDL + seed do prompt `default`
