import React from "react";

import { DashboardPageClient } from "@/components/DashboardPageClient";
import { coerceAllowedTag } from "@/lib/scoring/taxonomy";
import {
  coerceTaskPageSize,
  coerceTaskSortBy,
  coerceTaskSortDir,
  DEFAULT_TASK_PAGE_SIZE,
  DEFAULT_TASK_SORT_BY,
  DEFAULT_TASK_SORT_DIR,
} from "@/lib/tasks/query";
import { listTasks } from "@/lib/tasks/service";

export const dynamic = "force-dynamic";

export default async function DashboardPage(props: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const sp = props.searchParams || {};

  const page = Math.max(1, Number(sp.page || "1") || 1);
  const pageSizeRaw = typeof sp.pageSize === "string" ? sp.pageSize : undefined;
  const pageSize = coerceTaskPageSize(pageSizeRaw) ?? DEFAULT_TASK_PAGE_SIZE;

  const scoreMin =
    typeof sp.scoreMin === "string" ? Number(sp.scoreMin) : undefined;
  const scoreMax =
    typeof sp.scoreMax === "string" ? Number(sp.scoreMax) : undefined;

  const category = typeof sp.category === "string" ? sp.category : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;
  const sortBy = coerceTaskSortBy(typeof sp.sortBy === "string" ? sp.sortBy : undefined);
  const sortDir = coerceTaskSortDir(typeof sp.sortDir === "string" ? sp.sortDir : undefined);

  const rawTags = sp.tags;
  const tags = (() => {
    const parts: string[] = [];
    if (typeof rawTags === "string") parts.push(rawTags);
    if (Array.isArray(rawTags)) parts.push(...rawTags);

    const out: string[] = [];
    const seen = new Set<string>();
    for (const part of parts) {
      for (const piece of part.split(",")) {
        const allowed = coerceAllowedTag(piece);
        if (!allowed) continue;
        if (seen.has(allowed)) continue;
        seen.add(allowed);
        out.push(allowed);
      }
    }
    return out.length ? out : undefined;
  })();

  const { items, total } = await listTasks({
    page,
    pageSize,
    scoreMin: Number.isFinite(scoreMin as number) ? (scoreMin as number) : undefined,
    scoreMax: Number.isFinite(scoreMax as number) ? (scoreMax as number) : undefined,
    category,
    search,
    from,
    to,
    tags,
    sortBy,
    sortDir,
  });

  return (
    <DashboardPageClient
      items={items}
      total={total}
      page={page}
      pageSize={pageSize}
      initialSort={{
        sortBy: sortBy ?? DEFAULT_TASK_SORT_BY,
        sortDir: sortDir ?? DEFAULT_TASK_SORT_DIR,
      }}
      initialFilters={{
        search: search || "",
        category: category || "",
        scoreMin: Number.isFinite(scoreMin as number) ? (scoreMin as number) : undefined,
        scoreMax: Number.isFinite(scoreMax as number) ? (scoreMax as number) : undefined,
        from: from || "",
        to: to || "",
        tags: tags || [],
        pageSize,
      }}
    />
  );
}
