import { z } from "zod";

import { requireAppApiKey } from "@/lib/api/auth";
import { deleteTaskById, getTaskById } from "@/lib/tasks/service";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(10000).optional(),
    isCompleted: z.boolean().optional(),
  })
  .refine((v) => v.title !== undefined || v.description !== undefined || v.isCompleted !== undefined, {
    message: "Nenhum campo para atualizar",
  });

export async function GET(request: Request, context: { params: { id: string } }) {
  const authError = requireAppApiKey(request);
  if (authError) return authError;

  try {
    const task = await getTaskById(context.params.id);
    if (!task) {
      return Response.json({ message: "Não encontrado" }, { status: 404 });
    }
    return Response.json({ task });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const authError = requireAppApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Body JSON inválido" }, { status: 400 });
  }

  const parsed = patchTaskSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { message: "Entrada inválida", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.isCompleted !== undefined) updates.is_completed = parsed.data.isCompleted;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", context.params.id)
      .select("*")
      .maybeSingle();

    if (error) {
      return Response.json({ message: error.message }, { status: 500 });
    }
    if (!data) {
      return Response.json({ message: "Não encontrado" }, { status: 404 });
    }

    return Response.json({ task: data });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const authError = requireAppApiKey(request);
  if (authError) return authError;

  try {
    const deleted = await deleteTaskById(context.params.id);
    if (!deleted) {
      return Response.json({ message: "Não encontrado" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
