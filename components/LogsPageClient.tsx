"use client";

import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Box,
  Card,
  Collapse,
  Grid,
  Group,
  LoadingOverlay,
  Modal,
  Pagination,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState, useTransition } from "react";

import { formatYmdDate, parseYmdDate } from "@/lib/dates/ymd";
import { OPENAI_LIGHT_MODEL_OPTIONS } from "@/lib/openai/models";
import { ScoringRunWithTaskRow } from "@/lib/tasks/types";

type LogsFiltersValue = {
  from: string;
  to: string;
  model: string;
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<ScoringRunWithTaskRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const fromDate = useMemo(() => parseYmdDate(filters.from), [filters.from]);
  const toDate = useMemo(() => parseYmdDate(filters.to), [filters.to]);
  const isCompact = useMediaQuery("(max-width: 36em)");

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
    if (filters.model?.trim()) sp.set("model", filters.model.trim());
    sp.set("page", String(next.page ?? props.page));
    return sp;
  }

  function applyFilters() {
    startTransition(() => {
      router.push(`/dashboard/logs?${buildSearchParams({ page: 1 }).toString()}`);
    });
  }

  function clearFilters() {
    setFilters({ from: "", to: "", model: "" });
    startTransition(() => {
      if (returnTo) {
        router.push(`/dashboard/logs?${new URLSearchParams({ returnTo }).toString()}`);
      } else {
        router.push("/dashboard/logs");
      }
    });
  }

  return (
    <Box pos="relative" mih="100vh">
      <LoadingOverlay
        visible={isPending}
        zIndex={3000}
        overlayProps={{ backgroundOpacity: 0.35, blur: 2 }}
        loaderProps={{ color: "indigo", size: "lg" }}
      />

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
        <Group
          justify="space-between"
          align="center"
          onClick={() => setFiltersOpen((v) => !v)}
          style={{ cursor: "pointer" }}
        >
          <Text fw={600}>Filtros</Text>
          <ActionIcon
            variant="subtle"
            aria-label={filtersOpen ? "Recolher filtros" : "Expandir filtros"}
          >
            {filtersOpen ? "▲" : "▼"}
          </ActionIcon>
        </Group>

        <Group gap={8} mt="sm" wrap="wrap">
          {(() => {
            const applied = props.initialFilters;
            const chips: React.ReactNode[] = [];

            const from = applied.from?.trim();
            const to = applied.to?.trim();
            if (from || to) {
              const dateLabel =
                from && to ? `${from} → ${to}` : from ? `≥ ${from}` : `≤ ${to}`;
              chips.push(
                <Badge key="date" variant="light" color="gray">
                  Data: {dateLabel}
                </Badge>,
              );
            }

            const model = applied.model?.trim();
            if (model) {
              chips.push(
                <Badge key="model" variant="light" color="gray">
                  Modelo: {model}
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
          <Grid align="flex-end" mt="md">
          <Grid.Col span={{ base: 6, md: 3 }}>
            <DateInput
              label="De"
              value={fromDate}
              onChange={(date) => {
                const nextFrom = formatYmdDate(date);
                setFilters((current) => ({
                  ...current,
                  from: nextFrom,
                  to:
                    nextFrom && current.to.trim() && current.to < nextFrom ? nextFrom : current.to,
                }));
              }}
              valueFormat="DD/MM/YYYY"
              maxDate={toDate ?? undefined}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <DateInput
              label="Até"
              value={toDate}
              onChange={(date) => {
                const nextTo = formatYmdDate(date);
                setFilters((current) => ({
                  ...current,
                  to: nextTo,
                  from:
                    nextTo && current.from.trim() && current.from > nextTo ? nextTo : current.from,
                }));
              }}
              valueFormat="DD/MM/YYYY"
              minDate={fromDate ?? undefined}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              label="Modelo (OpenAI)"
              placeholder="Todos"
              data={OPENAI_LIGHT_MODEL_OPTIONS}
              value={filters.model}
              onChange={(value) => setFilters((current) => ({ ...current, model: value || "" }))}
              clearable
              searchable
              nothingFoundMessage="Nenhum modelo encontrado"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Group justify="flex-end">
              <Button variant="default" onClick={clearFilters}>
                Limpar
              </Button>
              <Button onClick={applyFilters}>Aplicar</Button>
            </Group>
          </Grid.Col>
          </Grid>
        </Collapse>
      </Card>

      <Card withBorder p={0}>
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Data</Table.Th>
                <Table.Th>Tarefa</Table.Th>
                {!isCompact ? <Table.Th>Modelo</Table.Th> : null}
                {!isCompact ? <Table.Th>Prompt</Table.Th> : null}
                <Table.Th>Resultado</Table.Th>
                {!isCompact ? <Table.Th /> : null}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {props.items.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={isCompact ? 3 : 6}>
                    <Text c="dimmed" size="sm">
                      Nenhum log encontrado.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                props.items.map((run) => {
                  const score = getScoreFromParsed(run.parsed_output);
                  return (
                    <Table.Tr
                      key={run.id}
                      onClick={(e) => {
                        if (!isCompact) return;
                        if (e.defaultPrevented) return;
                        if (e.button !== 0) return;

                        const target = e.target;
                        if (target instanceof Element) {
                          if (target.closest("a,button,input,textarea,select,[role='button']")) {
                            return;
                          }
                        }

                        setSelected(run);
                      }}
                      onKeyDown={(e) => {
                        if (!isCompact) return;
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        setSelected(run);
                      }}
                      tabIndex={isCompact ? 0 : undefined}
                      role={isCompact ? "button" : undefined}
                      aria-label={isCompact ? `Ver log: ${run.task?.title || run.task_id}` : undefined}
                      style={isCompact ? { cursor: "pointer" } : undefined}
                    >
                      <Table.Td>
                        {isCompact ? formatDateCompact(run.created_at) : formatDate(run.created_at)}
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={4}>
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

                          {isCompact ? (
                            <Group gap={6} wrap="wrap">
                              <Badge size="xs" variant="light" color="gray">
                                {run.model}
                              </Badge>
                              <Badge size="xs" variant="light" color="gray">
                                v{run.prompt_version}
                              </Badge>
                            </Group>
                          ) : null}
                        </Stack>
                      </Table.Td>
                      {!isCompact ? (
                        <Table.Td>
                          <Group gap="xs">
                            <Badge variant="light">{run.provider}</Badge>
                            <Badge variant="light" color="gray">
                              {run.model}
                            </Badge>
                          </Group>
                        </Table.Td>
                      ) : null}
                      {!isCompact ? (
                        <Table.Td>
                          <Badge variant="light" color="gray">
                            v{run.prompt_version}
                          </Badge>
                        </Table.Td>
                      ) : null}
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
                      {!isCompact ? (
                        <Table.Td>
                          <Button size="xs" variant="default" onClick={() => setSelected(run)}>
                            Ver
                          </Button>
                        </Table.Td>
                      ) : null}
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
            startTransition(() => {
              router.push(`/dashboard/logs?${buildSearchParams({ page: p }).toString()}`);
            })
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
    </Box>
  );
}
