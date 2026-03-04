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

  function buildSearchParams(
    next: { page?: number; sortBy?: TaskSortBy; sortDir?: TaskSortDir } = {},
  ) {
    const sortByToUse = next.sortBy ?? sortBy;
    const sortDirToUse = next.sortDir ?? sortDir;

    const sp = new URLSearchParams();
    if (filters.search?.trim()) sp.set("search", filters.search.trim());
    if (filters.category?.trim()) sp.set("category", filters.category.trim());
    if (filters.tags?.length) sp.set("tags", filters.tags.join(","));
    if (typeof filters.scoreMin === "number") sp.set("scoreMin", String(filters.scoreMin));
    if (typeof filters.scoreMax === "number") sp.set("scoreMax", String(filters.scoreMax));
    if (filters.from?.trim()) sp.set("from", filters.from.trim());
    if (filters.to?.trim()) sp.set("to", filters.to.trim());

    if (
      sortByToUse !== DEFAULT_TASK_SORT_BY ||
      sortDirToUse !== DEFAULT_TASK_SORT_DIR
    ) {
      sp.set("sortBy", sortByToUse);
      sp.set("sortDir", sortDirToUse);
    }

    sp.set("page", String(next.page ?? props.page));
    return sp;
  }

  function applyFilters() {
    router.push(`/dashboard?${buildSearchParams({ page: 1 }).toString()}`);
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
    router.push(`/dashboard?${buildSearchParams({ page: 1, sortBy: nextBy, sortDir: nextDir }).toString()}`);
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

      <Card withBorder>
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
            const chips: React.ReactNode[] = [];

            const search = applied.search?.trim();
            if (search) {
              chips.push(
                <Badge key="search" variant="light" color="gray">
                  Busca: {search}
                </Badge>,
              );
            }

            const category = applied.category?.trim();
            if (category) {
              const categoryLabel =
                (SCORING_CATEGORY_LABELS as Record<string, string>)[category] || category;
              chips.push(
                <Badge key="category" variant="light" color="gray">
                  Categoria: {categoryLabel}
                </Badge>,
              );
            }

            if (applied.tags?.length) {
              for (const t of applied.tags) {
                const label = (ALLOWED_TAG_LABELS as Record<string, string>)[t] || t;
                chips.push(
                  <Badge key={`tag:${t}`} variant="light" color="indigo">
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

              chips.push(
                <Badge key="score" variant="light" color="gray">
                  Score: {scoreLabel}
                </Badge>,
              );
            }

            const from = applied.from?.trim();
            const to = applied.to?.trim();
            if (from || to) {
              const dateLabel = from && to ? `${from} → ${to}` : from ? `≥ ${from}` : `≤ ${to}`;
              chips.push(
                <Badge key="date" variant="light" color="gray">
                  Data: {dateLabel}
                </Badge>,
              );
            }

            if (
              props.initialSort.sortBy !== DEFAULT_TASK_SORT_BY ||
              props.initialSort.sortDir !== DEFAULT_TASK_SORT_DIR
            ) {
              const sortByLabelMap: Record<TaskSortBy, string> = {
                created_at: "Data",
                score: "Score",
                title: "Título",
              };
              const dirSymbol = props.initialSort.sortDir === "asc" ? "↑" : "↓";
              chips.push(
                <Badge key="sort" variant="light" color="gray">
                  Ordenação: {sortByLabelMap[props.initialSort.sortBy]} {dirSymbol}
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
          onChange={(p) => router.push(`/dashboard?${buildSearchParams({ page: p }).toString()}`)}
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
