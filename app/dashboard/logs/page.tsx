import React from "react";

import { LogsPageClient } from "@/components/LogsPageClient";
import { coerceOpenAILightModel } from "@/lib/openai/models";
import { listScoringRuns } from "@/lib/tasks/service";

export const dynamic = "force-dynamic";

export default async function LogsPage(props: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const sp = props.searchParams || {};

  const page = Math.max(1, Number(sp.page || "1") || 1);
  const pageSize = 20;

  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;
  const model = coerceOpenAILightModel(typeof sp.model === "string" ? sp.model : undefined);

  const { items, total } = await listScoringRuns({ page, pageSize, from, to, model });

  return (
    <LogsPageClient
      items={items}
      total={total}
      page={page}
      pageSize={pageSize}
      initialFilters={{ from: from || "", to: to || "", model: model || "" }}
    />
  );
}
