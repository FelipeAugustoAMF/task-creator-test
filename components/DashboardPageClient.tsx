"use client";

import {
  Button,
  Card,
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
        <TaskFilters
          value={filters}
          onChange={setFilters}
          onApply={applyFilters}
          onClear={clearFilters}
        />
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
