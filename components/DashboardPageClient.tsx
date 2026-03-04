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
import { TaskRow } from "@/lib/tasks/types";

export function DashboardPageClient(props: {
  items: TaskRow[];
  total: number;
  page: number;
  pageSize: number;
  initialFilters: TaskFiltersValue;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<TaskFiltersValue>(props.initialFilters);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setFilters(props.initialFilters);
  }, [props.initialFilters]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(props.total / props.pageSize));
  }, [props.pageSize, props.total]);

  function buildSearchParams(next: { page?: number } = {}) {
    const sp = new URLSearchParams();
    if (filters.search?.trim()) sp.set("search", filters.search.trim());
    if (filters.category?.trim()) sp.set("category", filters.category.trim());
    if (typeof filters.scoreMin === "number") sp.set("scoreMin", String(filters.scoreMin));
    if (typeof filters.scoreMax === "number") sp.set("scoreMax", String(filters.scoreMax));
    sp.set("page", String(next.page ?? props.page));
    return sp;
  }

  function applyFilters() {
    router.push(`/dashboard?${buildSearchParams({ page: 1 }).toString()}`);
  }

  function clearFilters() {
    setFilters({ search: "", category: "", scoreMin: undefined, scoreMax: undefined });
    router.push("/dashboard");
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={2}>
          <Title order={2}>Tasks</Title>
          <Text c="dimmed" size="sm">
            {props.total} total
          </Text>
        </Stack>

        <Button onClick={() => setModalOpen(true)}>New Task</Button>
      </Group>

      <Card withBorder>
        <TaskFilters
          value={filters}
          onChange={setFilters}
          onApply={applyFilters}
          onClear={clearFilters}
        />
      </Card>

      <TaskTable tasks={props.items} />

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

