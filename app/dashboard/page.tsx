import React from "react";

import { DashboardPageClient } from "@/components/DashboardPageClient";
import { listTasks } from "@/lib/tasks/service";

export const dynamic = "force-dynamic";

export default async function DashboardPage(props: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const sp = props.searchParams || {};

  const page = Math.max(1, Number(sp.page || "1") || 1);
  const pageSize = 20;

  const scoreMin =
    typeof sp.scoreMin === "string" ? Number(sp.scoreMin) : undefined;
  const scoreMax =
    typeof sp.scoreMax === "string" ? Number(sp.scoreMax) : undefined;

  const category = typeof sp.category === "string" ? sp.category : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;

  const { items, total } = await listTasks({
    page,
    pageSize,
    scoreMin: Number.isFinite(scoreMin as number) ? (scoreMin as number) : undefined,
    scoreMax: Number.isFinite(scoreMax as number) ? (scoreMax as number) : undefined,
    category,
    search,
  });

  return (
    <DashboardPageClient
      items={items}
      total={total}
      page={page}
      pageSize={pageSize}
      initialFilters={{
        search: search || "",
        category: category || "",
        scoreMin: Number.isFinite(scoreMin as number) ? (scoreMin as number) : undefined,
        scoreMax: Number.isFinite(scoreMax as number) ? (scoreMax as number) : undefined,
      }}
    />
  );
}

