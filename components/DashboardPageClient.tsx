"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Collapse,
  Group,
  Pagination,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useClickOutside } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { TaskFormModal } from "@/components/TaskFormModal";
import { TaskFilters, TaskFiltersValue } from "@/components/TaskFilters";
import { TaskTable } from "@/components/TaskTable";
import { ALLOWED_TAG_LABELS, SCORING_CATEGORY_LABELS } from "@/lib/scoring/taxonomy";
import {
  DEFAULT_TASK_SORT_BY,
  DEFAULT_TASK_SORT_DIR,
  TaskSortBy,
  TaskSortDir,
} from "@/lib/tasks/query";
import { TaskRow } from "@/lib/tasks/types";

export function DashboardPageClient(props: {
  items: TaskRow[];
  total: number;
  page: number;
  pageSize: number;
  initialSort: { sortBy: TaskSortBy; sortDir: TaskSortDir };
  initialFilters: TaskFiltersValue;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<TaskFiltersValue>(props.initialFilters);
  const [sortBy, setSortBy] = useState<TaskSortBy>(props.initialSort.sortBy);
  const [sortDir, setSortDir] = useState<TaskSortDir>(props.initialSort.sortDir);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const filtersCardRef = useClickOutside(() => setFiltersOpen(false));

  useEffect(() => {
    setFilters(props.initialFilters);
  }, [props.initialFilters]);

  useEffect(() => {
    setSortBy(props.initialSort.sortBy);
    setSortDir(props.initialSort.sortDir);
  }, [props.initialSort.sortBy, props.initialSort.sortDir]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(props.total / props.pageSize));
  }, [props.pageSize, props.total]);

  function buildSearchParamsFrom(params: {
    filters: TaskFiltersValue;
    page: number;
    sortBy: TaskSortBy;
    sortDir: TaskSortDir;
  }) {
    const sp = new URLSearchParams();
    const f = params.filters;

    if (f.search?.trim()) sp.set("search", f.search.trim());
    if (f.category?.trim()) sp.set("category", f.category.trim());
    if (f.tags?.length) sp.set("tags", f.tags.join(","));
    if (typeof f.scoreMin === "number") sp.set("scoreMin", String(f.scoreMin));
    if (typeof f.scoreMax === "number") sp.set("scoreMax", String(f.scoreMax));
    if (f.from?.trim()) sp.set("from", f.from.trim());
    if (f.to?.trim()) sp.set("to", f.to.trim());

    if (
      params.sortBy !== DEFAULT_TASK_SORT_BY ||
      params.sortDir !== DEFAULT_TASK_SORT_DIR
    ) {
      sp.set("sortBy", params.sortBy);
      sp.set("sortDir", params.sortDir);
    }

    if (params.page > 1) sp.set("page", String(params.page));

    return sp;
  }

  function buildSearchParams(
    next: { page?: number; sortBy?: TaskSortBy; sortDir?: TaskSortDir } = {},
  ) {
    return buildSearchParamsFrom({
      filters,
      page: next.page ?? props.page,
      sortBy: next.sortBy ?? sortBy,
      sortDir: next.sortDir ?? sortDir,
    });
  }

  function pushDashboard(sp: URLSearchParams) {
    const qs = sp.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  function applyFilters() {
    pushDashboard(buildSearchParams({ page: 1 }));
  }

  function clearFilters() {
    setFilters({
      search: "",
      category: "",
      scoreMin: undefined,
      scoreMax: undefined,
      from: "",
      to: "",
      tags: [],
    });
    setSortBy(DEFAULT_TASK_SORT_BY);
    setSortDir(DEFAULT_TASK_SORT_DIR);
    router.push("/dashboard");
  }

  function onSortChange(nextBy: TaskSortBy) {
    const nextDir: TaskSortDir =
      nextBy === sortBy
        ? sortDir === "asc"
          ? "desc"
          : "asc"
        : nextBy === "title"
          ? "asc"
          : "desc";

    setSortBy(nextBy);
    setSortDir(nextDir);
    pushDashboard(buildSearchParams({ page: 1, sortBy: nextBy, sortDir: nextDir }));
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={2}>
          <Title order={2}>Tarefas</Title>
          <Text c="dimmed" size="sm">
            {props.total} no total
          </Text>
        </Stack>

        <Button onClick={() => setModalOpen(true)}>Nova tarefa</Button>
      </Group>

      <Card withBorder ref={filtersCardRef}>
        <Group justify="space-between" align="center">
          <Text fw={600}>Filtros</Text>
          <ActionIcon
            variant="subtle"
            aria-label={filtersOpen ? "Recolher filtros" : "Expandir filtros"}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {filtersOpen ? "▲" : "▼"}
          </ActionIcon>
        </Group>

        <Group gap={8} mt="sm" wrap="wrap">
          {(() => {
            const applied = props.initialFilters;
            const appliedSort = props.initialSort;
            const chips: React.ReactNode[] = [];

            const search = applied.search?.trim();
            if (search) {
              const nextApplied: TaskFiltersValue = { ...applied, search: "" };
              chips.push(
                <Badge
                  key="search"
                  variant="light"
                  color="gray"
                  rightSection={
                    <ActionIcon
                      variant="transparent"
                      size="xs"
                      aria-label="Remover filtro: Título"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilters(nextApplied);
                        pushDashboard(
                          buildSearchParamsFrom({
                            filters: nextApplied,
                            page: 1,
                            sortBy: appliedSort.sortBy,
                            sortDir: appliedSort.sortDir,
                          }),
                        );
                      }}
                    >
                      x
                    </ActionIcon>
                  }
                >
                  Título: {search}
                </Badge>,
              );
            }

            const category = applied.category?.trim();
            if (category) {
              const categoryLabel =
                (SCORING_CATEGORY_LABELS as Record<string, string>)[category] || category;
              const nextApplied: TaskFiltersValue = { ...applied, category: "" };
              chips.push(
                <Badge
                  key="category"
                  variant="light"
                  color="gray"
                  rightSection={
                    <ActionIcon
                      variant="transparent"
                      size="xs"
                      aria-label="Remover filtro: Categoria"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilters(nextApplied);
                        pushDashboard(
                          buildSearchParamsFrom({
                            filters: nextApplied,
                            page: 1,
                            sortBy: appliedSort.sortBy,
                            sortDir: appliedSort.sortDir,
                          }),
                        );
                      }}
                    >
                      x
                    </ActionIcon>
                  }
                >
                  Categoria: {categoryLabel}
                </Badge>,
              );
            }

            if (applied.tags?.length) {
              for (const t of applied.tags) {
                const label = (ALLOWED_TAG_LABELS as Record<string, string>)[t] || t;
                const nextApplied: TaskFiltersValue = {
                  ...applied,
                  tags: applied.tags.filter((x) => x !== t),
                };
                chips.push(
                  <Badge
                    key={`tag:${t}`}
                    variant="light"
                    color="indigo"
                    rightSection={
                      <ActionIcon
                        variant="transparent"
                        size="xs"
                        aria-label={`Remover tag: ${label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters(nextApplied);
                          pushDashboard(
                            buildSearchParamsFrom({
                              filters: nextApplied,
                              page: 1,
                              sortBy: appliedSort.sortBy,
                              sortDir: appliedSort.sortDir,
                            }),
                          );
                        }}
                      >
                        x
                      </ActionIcon>
                    }
                  >
                    {label}
                  </Badge>,
                );
              }
            }

            const scoreMin = applied.scoreMin;
            const scoreMax = applied.scoreMax;
            if (typeof scoreMin === "number" || typeof scoreMax === "number") {
              const scoreLabel =
                typeof scoreMin === "number" && typeof scoreMax === "number"
                  ? `${scoreMin}–${scoreMax}`
                  : typeof scoreMin === "number"
                    ? `≥ ${scoreMin}`
                    : `≤ ${scoreMax}`;

              const nextApplied: TaskFiltersValue = {
                ...applied,
                scoreMin: undefined,
                scoreMax: undefined,
              };
              chips.push(
                <Badge
                  key="score"
                  variant="light"
                  color="gray"
                  rightSection={
                    <ActionIcon
                      variant="transparent"
                      size="xs"
                      aria-label="Remover filtro: Score"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilters(nextApplied);
                        pushDashboard(
                          buildSearchParamsFrom({
                            filters: nextApplied,
                            page: 1,
                            sortBy: appliedSort.sortBy,
                            sortDir: appliedSort.sortDir,
                          }),
                        );
                      }}
                    >
                      x
                    </ActionIcon>
                  }
                >
                  Score: {scoreLabel}
                </Badge>,
              );
            }

            const from = applied.from?.trim();
            const to = applied.to?.trim();
            if (from || to) {
              const dateLabel = from && to ? `${from} → ${to}` : from ? `≥ ${from}` : `≤ ${to}`;
              const nextApplied: TaskFiltersValue = { ...applied, from: "", to: "" };
              chips.push(
                <Badge
                  key="date"
                  variant="light"
                  color="gray"
                  rightSection={
                    <ActionIcon
                      variant="transparent"
                      size="xs"
                      aria-label="Remover filtro: Data"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilters(nextApplied);
                        pushDashboard(
                          buildSearchParamsFrom({
                            filters: nextApplied,
                            page: 1,
                            sortBy: appliedSort.sortBy,
                            sortDir: appliedSort.sortDir,
                          }),
                        );
                      }}
                    >
                      x
                    </ActionIcon>
                  }
                >
                  Data: {dateLabel}
                </Badge>,
              );
            }

            if (
              appliedSort.sortBy !== DEFAULT_TASK_SORT_BY ||
              appliedSort.sortDir !== DEFAULT_TASK_SORT_DIR
            ) {
              const sortByLabelMap: Record<TaskSortBy, string> = {
                created_at: "Data",
                score: "Score",
                title: "Título",
              };
              const dirSymbol = appliedSort.sortDir === "asc" ? "↑" : "↓";
              chips.push(
                <Badge
                  key="sort"
                  variant="light"
                  color="gray"
                  rightSection={
                    <ActionIcon
                      variant="transparent"
                      size="xs"
                      aria-label="Remover ordenação personalizada"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(DEFAULT_TASK_SORT_BY);
                        setSortDir(DEFAULT_TASK_SORT_DIR);
                        pushDashboard(
                          buildSearchParamsFrom({
                            filters: applied,
                            page: 1,
                            sortBy: DEFAULT_TASK_SORT_BY,
                            sortDir: DEFAULT_TASK_SORT_DIR,
                          }),
                        );
                      }}
                    >
                      x
                    </ActionIcon>
                  }
                >
                  Ordenação: {sortByLabelMap[appliedSort.sortBy]} {dirSymbol}
                </Badge>,
              );
            }

            if (chips.length === 0) {
              return (
                <Text key="none" c="dimmed" size="sm">
                  Nenhum filtro aplicado.
                </Text>
              );
            }

            return chips;
          })()}
        </Group>

        <Collapse in={filtersOpen}>
          <Stack mt="md">
            <TaskFilters
              value={filters}
              onChange={setFilters}
              onApply={applyFilters}
              onClear={clearFilters}
            />
          </Stack>
        </Collapse>
      </Card>

      <Card withBorder p={0}>
        <TaskTable
          tasks={props.items}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={onSortChange}
        />
      </Card>

      <Group justify="center">
        <Pagination
          value={props.page}
          total={totalPages}
          onChange={(p) => pushDashboard(buildSearchParams({ page: p }))}
        />
      </Group>

      <TaskFormModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          router.refresh();
        }}
      />
    </Stack>
  );
}
