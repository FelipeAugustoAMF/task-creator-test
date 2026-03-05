"use client";

import {
  Anchor,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Modal,
  Pagination,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { ScoringRunWithTaskRow } from "@/lib/tasks/types";

type LogsFiltersValue = {
  from: string;
  to: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

function getScoreFromParsed(parsed: unknown): number | null {
  if (!parsed || typeof parsed !== "object") return null;
  const score = (parsed as Record<string, unknown>).score;
  if (typeof score === "number" && Number.isFinite(score)) return Math.round(score);
  if (typeof score === "string") {
    const n = Number(score);
    if (Number.isFinite(n)) return Math.round(n);
  }
  return null;
}

export function LogsPageClient(props: {
  items: ScoringRunWithTaskRow[];
  total: number;
  page: number;
  pageSize: number;
  initialFilters: LogsFiltersValue;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToRaw = searchParams.get("returnTo");
  const returnTo = returnToRaw && returnToRaw.startsWith("/dashboard") ? returnToRaw : null;
  const [filters, setFilters] = useState<LogsFiltersValue>(props.initialFilters);
  const [selected, setSelected] = useState<ScoringRunWithTaskRow | null>(null);

  useEffect(() => {
    setFilters(props.initialFilters);
  }, [props.initialFilters]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(props.total / props.pageSize));
  }, [props.pageSize, props.total]);

  function buildSearchParams(next: { page?: number } = {}) {
    const sp = new URLSearchParams();
    if (returnTo) sp.set("returnTo", returnTo);
    if (filters.from?.trim()) sp.set("from", filters.from.trim());
    if (filters.to?.trim()) sp.set("to", filters.to.trim());
    sp.set("page", String(next.page ?? props.page));
    return sp;
  }

  function applyFilters() {
    router.push(`/dashboard/logs?${buildSearchParams({ page: 1 }).toString()}`);
  }

  function clearFilters() {
    setFilters({ from: "", to: "" });
    if (returnTo) {
      router.push(`/dashboard/logs?${new URLSearchParams({ returnTo }).toString()}`);
    } else {
      router.push("/dashboard/logs");
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={2}>
          <Title order={2}>Logs</Title>
          <Text c="dimmed" size="sm">
            {props.total} execuções
          </Text>
        </Stack>
      </Group>

      <Card withBorder>
        <Grid align="flex-end">
          <Grid.Col span={{ base: 6, md: 3 }}>
            <TextInput
              type="date"
              label="De"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.currentTarget.value })}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <TextInput
              type="date"
              label="Até"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.currentTarget.value })}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Group justify="flex-end">
              <Button variant="default" onClick={clearFilters}>
                Limpar
              </Button>
              <Button onClick={applyFilters}>Aplicar</Button>
            </Group>
          </Grid.Col>
        </Grid>
      </Card>

      <Card withBorder p={0}>
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Data</Table.Th>
                <Table.Th>Tarefa</Table.Th>
                <Table.Th>Modelo</Table.Th>
                <Table.Th>Prompt</Table.Th>
                <Table.Th>Resultado</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {props.items.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" size="sm">
                      Nenhum log encontrado.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                props.items.map((run) => {
                  const score = getScoreFromParsed(run.parsed_output);
                  return (
                    <Table.Tr key={run.id}>
                      <Table.Td>{formatDate(run.created_at)}</Table.Td>
                      <Table.Td>
                        <Anchor
                          component={Link}
                          href={
                            returnTo
                              ? `/dashboard/tasks/${run.task_id}?returnTo=${encodeURIComponent(returnTo)}`
                              : `/dashboard/tasks/${run.task_id}`
                          }
                        >
                          {run.task?.title || run.task_id}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Badge variant="light">{run.provider}</Badge>
                          <Badge variant="light" color="gray">
                            {run.model}
                          </Badge>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="gray">
                          v{run.prompt_version}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {score == null ? (
                          <Badge color="red" variant="light">
                            falhou
                          </Badge>
                        ) : (
                          <Badge color="indigo" variant="light">
                            score {score}
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Button size="xs" variant="default" onClick={() => setSelected(run)}>
                          Ver
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      <Group justify="center">
        <Pagination
          value={props.page}
          total={totalPages}
          onChange={(p) =>
            router.push(`/dashboard/logs?${buildSearchParams({ page: p }).toString()}`)
          }
        />
      </Group>

      <Modal
        opened={selected != null}
        onClose={() => setSelected(null)}
        title="Detalhes do log"
        size="xl"
        centered
      >
        {selected && (
          <Stack gap="sm">
            <Group gap="xs" justify="space-between">
              <Group gap="xs">
                <Badge variant="light">{selected.provider}</Badge>
                <Badge variant="light" color="gray">
                  {selected.model}
                </Badge>
                <Badge variant="light" color="gray">
                  v{selected.prompt_version}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {formatDate(selected.created_at)}
              </Text>
            </Group>

            <Textarea
              label="Prompt renderizado"
              value={selected.rendered_prompt}
              readOnly
              autosize
              minRows={6}
            />
            <Textarea
              label="Resposta bruta"
              value={selected.raw_response}
              readOnly
              autosize
              minRows={6}
            />
            <Textarea
              label="Saída parseada"
              value={
                selected.parsed_output && typeof selected.parsed_output === "object"
                  ? JSON.stringify(selected.parsed_output, null, 2)
                  : selected.parsed_output
                    ? String(selected.parsed_output)
                    : "—"
              }
              readOnly
              autosize
              minRows={6}
            />
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
