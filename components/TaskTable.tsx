"use client";

import {
  Anchor,
  Badge,
  Group,
  ScrollArea,
  Table,
  Text,
} from "@mantine/core";
import Link from "next/link";
import React from "react";

import { ALLOWED_TAG_LABELS, SCORING_CATEGORY_LABELS } from "@/lib/scoring/taxonomy";
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

export function TaskTable(props: { tasks: TaskRow[] }) {
  return (
    <ScrollArea>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Score</Table.Th>
            <Table.Th>Título</Table.Th>
            <Table.Th>Categoria</Table.Th>
            <Table.Th>Tags</Table.Th>
            <Table.Th>Criada em</Table.Th>
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
