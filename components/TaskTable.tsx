"use client";

import {
  Anchor,
  Badge,
  Group,
  ScrollArea,
  Table,
  Text,
  UnstyledButton,
} from "@mantine/core";
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

function SortableTh(props: {
  label: string;
  by: TaskSortBy;
  activeBy: TaskSortBy;
  dir: TaskSortDir;
  onChange: (by: TaskSortBy) => void;
}) {
  const active = props.activeBy === props.by;
  const indicator = active ? (props.dir === "asc" ? "▲" : "▼") : "↕";

  return (
    <Table.Th>
      <UnstyledButton
        onClick={() => props.onChange(props.by)}
        style={{ width: "100%", cursor: "pointer" }}
      >
        <Group gap={6} wrap="nowrap" justify="space-between">
          <Text fw={600} size="sm">
            {props.label}
          </Text>
          <Text size="xs" c={active ? "dark" : "dimmed"}>
            {indicator}
          </Text>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

export function TaskTable(props: {
  tasks: TaskRow[];
  sortBy: TaskSortBy;
  sortDir: TaskSortDir;
  onSortChange: (by: TaskSortBy) => void;
}) {
  return (
    <ScrollArea>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <SortableTh
              label="Score"
              by="score"
              activeBy={props.sortBy}
              dir={props.sortDir}
              onChange={props.onSortChange}
            />
            <SortableTh
              label="Título"
              by="title"
              activeBy={props.sortBy}
              dir={props.sortDir}
              onChange={props.onSortChange}
            />
            <Table.Th>
              <Text fw={600} size="sm">
                Categoria
              </Text>
            </Table.Th>
            <Table.Th>
              <Text fw={600} size="sm">
                Tags
              </Text>
            </Table.Th>
            <SortableTh
              label="Criada em"
              by="created_at"
              activeBy={props.sortBy}
              dir={props.sortDir}
              onChange={props.onSortChange}
            />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {props.tasks.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="dimmed" size="sm">
                  Nenhuma tarefa encontrada.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            props.tasks.map((task) => (
              <Table.Tr key={task.id}>
                <Table.Td>
                  {task.status !== "done" ? (
                    <Badge color="red" variant="light">
                      falhou
                    </Badge>
                  ) : (
                    <Badge color={scoreColor(task.score ?? 0)} variant="light">
                      {task.score}
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Anchor component={Link} href={`/dashboard/tasks/${task.id}`}>
                    {task.title}
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  {task.category ? (
                    <Badge color="gray" variant="light">
                      {formatCategory(task.category)}
                    </Badge>
                  ) : (
                    <Text c="dimmed" size="sm">
                      —
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="wrap">
                    {task.tags?.length ? (
                      task.tags.map((tag) => (
                        <Badge key={tag} size="sm" variant="outline">
                          {formatTag(tag)}
                        </Badge>
                      ))
                    ) : (
                      <Text c="dimmed" size="sm">
                        —
                      </Text>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>{formatDate(task.created_at)}</Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
