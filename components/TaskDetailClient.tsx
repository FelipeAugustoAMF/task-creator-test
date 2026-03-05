"use client";

import {
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

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

export function TaskDetailClient(props: { task: TaskRow }) {
  const { task } = props;
  const searchParams = useSearchParams();
  const returnToRaw = searchParams.get("returnTo");
  const returnTo = returnToRaw && returnToRaw.startsWith("/dashboard") ? returnToRaw : "/dashboard";
  const [tab, setTab] = useState<string | null>("details");
  const [runs, setRuns] = useState<ScoringRunRow[] | null>(null);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState<string | null>(null);

  function retryRuns() {
    setRuns(null);
    setRunsError(null);
    setRunsLoading(false);
  }

  useEffect(() => {
    setTab("details");
    setRuns(null);
    setRunsError(null);
    setRunsLoading(false);
  }, [task.id]);

  useEffect(() => {
    if (tab !== "logs") return;
    if (runs != null || runsLoading || runsError) return;

    setRunsLoading(true);
    setRunsError(null);

    fetch(`/api/dashboard/tasks/${task.id}/runs`, { cache: "no-store" })
      .then(async (res) => {
        if (res.ok) return res.json();
        const body = await res.json().catch(() => null);
        const message =
          body && typeof body === "object" && typeof body.message === "string"
            ? body.message
            : `Falha ao carregar logs (${res.status})`;
        throw new Error(message);
      })
      .then((body) => {
        const nextRuns = body && typeof body === "object" ? (body as any).runs : null;
        setRuns(Array.isArray(nextRuns) ? nextRuns : []);
      })
      .catch((error) => {
        setRunsError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        setRunsLoading(false);
      });
  }, [runs, runsLoading, runsError, tab, task.id]);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={2}>
          <Button
            component={Link}
            href={returnTo}
            variant="default"
            size="xs"
            radius="xl"
            leftSection="←"
          >
            Voltar para tarefas
          </Button>
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

      <Tabs value={tab} onChange={setTab} keepMounted={false}>
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
          {runsLoading ? (
            <Card withBorder>
              <Text c="dimmed" size="sm">
                Carregando logs...
              </Text>
            </Card>
          ) : runsError ? (
            <Card withBorder>
              <Stack gap="xs">
                <Text c="red" size="sm">
                  {runsError}
                </Text>
                <Group justify="flex-end">
                  <Button size="xs" variant="default" onClick={retryRuns}>
                    Tentar novamente
                  </Button>
                </Group>
              </Stack>
            </Card>
          ) : runs ? (
            <PromptRunViewer runs={runs} />
          ) : null}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
