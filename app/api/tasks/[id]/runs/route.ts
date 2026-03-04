import { requireAppApiKey } from "@/lib/api/auth";
import { listTaskRuns } from "@/lib/tasks/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: { id: string } }) {
  const authError = requireAppApiKey(request);
  if (authError) return authError;

  try {
    const runs = await listTaskRuns(context.params.id);
    return Response.json({ runs });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

