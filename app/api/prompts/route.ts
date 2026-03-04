import { requireAppApiKey } from "@/lib/api/auth";
import { listPrompts } from "@/lib/tasks/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = requireAppApiKey(request);
  if (authError) return authError;

  try {
    const prompts = await listPrompts();
    return Response.json({ prompts });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

