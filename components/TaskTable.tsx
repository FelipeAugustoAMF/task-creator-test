"use client";

import {
  Badge,
  Button,
  Group,
  Card,
  Text,
  Stack,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import Link from "next/link";
import React from "react";

import { ALLOWED_TAG_LABELS, SCORING_CATEGORY_LABELS } from "@/lib/scoring/taxonomy";
import { TaskSortBy, TaskSortDir } from "@/lib/tasks/query";
import { TaskRow } from "@/lib/tasks/types";

const legacyCategoryMap: Record<string, string> = {
  incident: "incidente",
  bug: "defeito",
  feature: "melhoria",
  ops: "manutenção",
  finance: "financeiro",
  support: "suporte",
  other: "outro",
  manutencao: "manutenção",
  seguranca: "segurança",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

function formatDateCompact(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCategory(value: string) {
  const key = value.trim().toLowerCase();
  const canonical = legacyCategoryMap[key] ?? key;
  return (SCORING_CATEGORY_LABELS as Record<string, string>)[canonical] || value;
}

function formatTag(value: string) {
  return (ALLOWED_TAG_LABELS as Record<string, string>)[value] || value;
}

function scoreColor(score: number) {
  if (score >= 8) return "red";
  if (score >= 5) return "yellow";
  return "green";
}

export function TaskTable(props: {
  tasks: TaskRow[];
  returnTo?: string;
  sortBy: TaskSortBy;
  sortDir: TaskSortDir;
  onSortChange: (by: TaskSortBy) => void;
  onOpenTask?: (taskId: string) => void;
}) {
  const isCompact = useMediaQuery("(max-width: 36em)");
  const maxTags = isCompact ? 3 : 6;

  function taskDetailsHref(taskId: string) {
    return props.returnTo
      ? `/dashboard/tasks/${taskId}?returnTo=${encodeURIComponent(props.returnTo)}`
      : `/dashboard/tasks/${taskId}`;
  }

  const sortLabelMap: Record<TaskSortBy, string> = {
    score: "Score",
    title: "Título",
    created_at: "Data",
  };

  function sortIndicator(by: TaskSortBy) {
    if (props.sortBy !== by) return "↕";
    return props.sortDir === "asc" ? "↑" : "↓";
  }

  function renderSortButton(by: TaskSortBy) {
    const active = props.sortBy === by;
    return (
      <Button
        key={by}
        size="xs"
        radius="xl"
        variant={active ? "light" : "subtle"}
        color="indigo"
        onClick={() => props.onSortChange(by)}
        rightSection={
          <Text component="span" size="xs" c={active ? "indigo" : "dimmed"}>
            {sortIndicator(by)}
          </Text>
        }
      >
        {sortLabelMap[by]}
      </Button>
    );
  }

  function onTaskClick(
    event: React.MouseEvent,
    params: { taskId: string },
  ) {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    props.onOpenTask?.(params.taskId);
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center" wrap="wrap">
        <Text fw={600} size="sm">
          Ordenar por
        </Text>
        <Group gap="xs">
          {renderSortButton("score")}
          {renderSortButton("title")}
          {renderSortButton("created_at")}
        </Group>
      </Group>

      {props.tasks.length === 0 ? (
        <Card withBorder>
          <Text c="dimmed" size="sm">
            Nenhuma tarefa encontrada.
          </Text>
        </Card>
      ) : (
        <Stack gap="sm">
          {props.tasks.map((task) => {
            const href = taskDetailsHref(task.id);
            const taskScoreBadge =
              task.status !== "done" ? (
                <Badge color="red" variant="light">
                  falhou
                </Badge>
              ) : (
                <Badge color={scoreColor(task.score ?? 0)} variant="light">
                  {task.score ?? "—"}
                </Badge>
              );

            const shownTags = task.tags?.slice(0, maxTags) ?? [];
            const remainingTags = Math.max(0, (task.tags?.length ?? 0) - shownTags.length);

            return (
              <Card
                key={task.id}
                component={Link}
                href={href}
                onClick={(e) => onTaskClick(e, { taskId: task.id })}
                withBorder
                radius="md"
                padding="md"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Stack gap={8}>
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                      {taskScoreBadge}
                      <Text fw={600} lineClamp={1} style={{ minWidth: 0 }}>
                        {task.title}
                      </Text>
                    </Group>

                    <Badge
                      size="xs"
                      color={task.is_completed ? "green" : "yellow"}
                      variant="light"
                    >
                      {task.is_completed ? "concluída" : "pendente"}
                    </Badge>
                  </Group>

                  <Text size="xs" c="dimmed">
                    {isCompact ? formatDateCompact(task.created_at) : formatDate(task.created_at)}
                  </Text>

                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {task.description}
                  </Text>

                  <Group gap={6} wrap="wrap">
                    {task.category ? (
                      <Badge size="xs" color="gray" variant="light">
                        {formatCategory(task.category)}
                      </Badge>
                    ) : null}

                    {shownTags.length ? (
                      shownTags.map((tag) => (
                        <Badge key={tag} size="xs" variant="outline">
                          {formatTag(tag)}
                        </Badge>
                      ))
                    ) : (
                      <Text size="xs" c="dimmed">
                        Sem tags
                      </Text>
                    )}

                    {remainingTags > 0 ? (
                      <Badge size="xs" color="gray" variant="outline">
                        +{remainingTags}
                      </Badge>
                    ) : null}
                  </Group>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
