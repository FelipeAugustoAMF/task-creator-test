import "server-only";

export function requireAppApiKey(request: Request): Response | null {
  const configuredKey = process.env.APP_API_KEY;
  if (!configuredKey) {
    return Response.json(
      { message: "Server misconfigured: missing APP_API_KEY" },
      { status: 500 },
    );
  }

  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();

  if (!token || token !== configuredKey) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  return null;
}

