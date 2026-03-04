"use client";

import {
  Anchor,
  Badge,
  Card,
  Group,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import React from "react";

import { PromptRunViewer } from "@/components/PromptRunViewer";
import { ALLOWED_TAG_LABELS, SCORING_CATEGORY_LABELS } from "@/lib/scoring/taxonomy";
import { ScoringRunRow, TaskRow } from "@/lib/tasks/types";

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

const statusLabelMap: Record<string, string> = {
  done: "concluída",
  failed: "falhou",
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

export function TaskDetailClient(props: { task: TaskRow; runs: ScoringRunRow[] }) {
  const { task } = props;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={2}>
          <Anchor component={Link} href="/dashboard" size="sm">
            ← Voltar para tarefas
          </Anchor>
          <Title order={2}>{task.title}</Title>
          <Text c="dimmed" size="sm">
            {formatDate(task.created_at)}
          </Text>
          <Text c="dimmed" size="sm" lineClamp={2}>
            {task.description}
          </Text>
        </Stack>

        <Group>
          <Badge color={task.status === "done" ? "indigo" : "red"} variant="light">
            {statusLabelMap[task.status] || task.status}
          </Badge>
          {task.status === "done" && (
            <Badge color="gray" variant="light">
              score {task.score}
            </Badge>
          )}
        </Group>
      </Group>

      <Tabs defaultValue="details">
        <Tabs.List>
          <Tabs.Tab value="details">Detalhes</Tabs.Tab>
          <Tabs.Tab value="logs">Logs de prompt</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="md">
          <Card withBorder>
            <Stack gap="sm">
              <Group gap="xs">
                <Text fw={600}>Categoria:</Text>
                <Text>{task.category ? formatCategory(task.category) : "—"}</Text>
              </Group>
              <Group gap="xs">
                <Text fw={600}>Confiança:</Text>
                <Text>
                  {typeof task.confidence === "number" ? task.confidence.toFixed(2) : "—"}
                </Text>
              </Group>
              <Group gap="xs" align="flex-start">
                <Text fw={600}>Tags:</Text>
                <Group gap={6}>
                  {task.tags?.length ? (
                    task.tags.map((t) => (
                      <Badge key={t} size="sm" variant="outline">
                        {formatTag(t)}
                      </Badge>
                    ))
                  ) : (
                    <Text c="dimmed">—</Text>
                  )}
                </Group>
              </Group>
              <Group gap="xs" align="flex-start">
                <Text fw={600}>Justificativa:</Text>
                <Text style={{ flex: 1 }}>{task.rationale || "—"}</Text>
              </Group>
              <Stack gap={4}>
                <Text fw={600}>Descrição</Text>
                <Text style={{ whiteSpace: "pre-wrap" }}>{task.description}</Text>
              </Stack>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="logs" pt="md">
          <PromptRunViewer runs={props.runs} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
