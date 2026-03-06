import { cookies } from "next/headers";

import { parseSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getScoringRunDetail } from "@/lib/tasks/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: { id: string } }) {
  const session = parseSessionCookieValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return Response.json({ message: "Não autorizado" }, { status: 401 });
  }

  try {
    const run = await getScoringRunDetail(context.params.id);
    if (!run) {
      return Response.json({ message: "Execução não encontrada" }, { status: 404 });
    }

    return Response.json({ run });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

