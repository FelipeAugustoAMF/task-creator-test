import { z } from "zod";

import { requireAppApiKey } from "@/lib/api/auth";
import { createTaskAndScore, listTasks } from "@/lib/tasks/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10000),
});

export async function POST(request: Request) {
  const authError = requireAppApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Body JSON inválido" }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { message: "Entrada inválida", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let result;
  try {
    result = await createTaskAndScore(parsed.data);
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }

  if (!result.ok) {
    return Response.json(
      { taskId: result.taskId, message: result.message },
      { status: 500 },
    );
  }

  return Response.json({ task: result.task });
}

export async function GET(request: Request) {
  const authError = requireAppApiKey(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const pageSizeRaw = Number(searchParams.get("pageSize") || "20") || 20;
    const pageSize = Math.min(100, Math.max(1, pageSizeRaw));

    const scoreMinRaw = searchParams.get("scoreMin");
    const scoreMaxRaw = searchParams.get("scoreMax");
    const scoreMin = scoreMinRaw != null ? Number(scoreMinRaw) : undefined;
    const scoreMax = scoreMaxRaw != null ? Number(scoreMaxRaw) : undefined;

    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const { items, total } = await listTasks({
      page,
      pageSize,
      scoreMin: Number.isFinite(scoreMin as number) ? (scoreMin as number) : undefined,
      scoreMax: Number.isFinite(scoreMax as number) ? (scoreMax as number) : undefined,
      category,
      search,
      from,
      to,
    });

    return Response.json({ items, total, page, pageSize });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
