import { requireAppApiKey } from "@/lib/api/auth";
import { getTaskById } from "@/lib/tasks/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
