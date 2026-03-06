"use client";

import {
  Accordion,
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Box,
  Card,
  Collapse,
  CopyButton,
  Divider,
  Grid,
  Group,
  Loader,
  LoadingOverlay,
  Pagination,
  Select,
  Stack,
  Tabs,
  Text,
  Textarea,
  ThemeIcon,
  Tooltip,
  Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconAdjustments,
  IconBraces,
  IconBrandOpenai,
  IconCalendarEvent,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconCopy,
  IconExternalLink,
  IconFileText,
  IconHash,
  IconMessage,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState, useTransition } from "react";

import { formatYmdDate, parseYmdDate } from "@/lib/dates/ymd";
import { OPENAI_LIGHT_MODEL_OPTIONS } from "@/lib/openai/models";
import { ScoringRunDetailRow, ScoringRunSummaryRow } from "@/lib/tasks/types";

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

function getCategoryFromParsed(parsed: unknown): string | null {
  if (!parsed || typeof parsed !== "object") return null;
  const category = (parsed as Record<string, unknown>).category;
  return typeof category === "string" && category.trim() ? category.trim() : null;
}

function getTagsFromParsed(parsed: unknown): string[] | null {
  if (!parsed || typeof parsed !== "object") return null;
  const tags = (parsed as Record<string, unknown>).tags;
  if (!Array.isArray(tags)) return null;
  const safe = tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  return safe.length ? safe : null;
}

function getConfidenceFromParsed(parsed: unknown): number | null {
  if (!parsed || typeof parsed !== "object") return null;
  const confidence = (parsed as Record<string, unknown>).confidence;
  if (typeof confidence === "number" && Number.isFinite(confidence)) return confidence;
  if (typeof confidence === "string") {
    const n = Number(confidence);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function getRationaleFromParsed(parsed: unknown): string | null {
  if (!parsed || typeof parsed !== "object") return null;
  const rationale = (parsed as Record<string, unknown>).rationale;
  return typeof rationale === "string" && rationale.trim() ? rationale.trim() : null;
}

function formatConfidence(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function scoreColor(score: number) {
  if (score >= 8) return "red";
  if (score >= 5) return "yellow";
  return "green";
}

function truncateId(value: string) {
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function CopyAction(props: { value: string; ariaLabel: string }) {
  return (
    <CopyButton value={props.value} timeout={1200}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? "Copiado" : "Copiar"} withArrow position="top">
          <ActionIcon
            variant="subtle"
            aria-label={props.ariaLabel}
            onClick={(e) => {
              e.stopPropagation();
              copy();
            }}
          >
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );
}

function IdRow(props: { label: string; value: string; href?: string; hrefLabel?: string }) {
  return (
    <Group justify="space-between" gap="xs" wrap="nowrap">
      <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
        <ThemeIcon size="sm" variant="light" color="gray" radius="md">
          <IconHash size={14} />
        </ThemeIcon>
        <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
          {props.label}
        </Text>
      </Group>

      <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
        {props.href ? (
          <Anchor
            component={Link}
            href={props.href}
            size="xs"
            onClick={(e) => e.stopPropagation()}
            style={{ whiteSpace: "nowrap" }}
          >
            <Group gap={4} wrap="nowrap">
              <IconExternalLink size={14} />
              <span>{props.hrefLabel || "Abrir"}</span>
            </Group>
          </Anchor>
        ) : null}

        <Text
          size="xs"
          fw={500}
          style={{
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {truncateId(props.value)}
        </Text>

        <CopyAction value={props.value} ariaLabel={`Copiar ${props.label}`} />
      </Group>
    </Group>
  );
}

function RunDetailView(props: { run: ScoringRunDetailRow; taskHref: string; promptLabel: string }) {
  const { run } = props;
  const score = getScoreFromParsed(run.parsed_output);
  const category = getCategoryFromParsed(run.parsed_output);
  const tags = getTagsFromParsed(run.parsed_output);
  const confidence = getConfidenceFromParsed(run.parsed_output);
  const rationale = getRationaleFromParsed(run.parsed_output);

  const parsedJson =
    run.parsed_output && typeof run.parsed_output === "object"
      ? JSON.stringify(run.parsed_output, null, 2)
      : run.parsed_output
        ? String(run.parsed_output)
        : "";

  const monoInputStyles = {
    input: {
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
    },
  } as const;

  return (
    <Grid gutter="md" align="flex-start">
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Card withBorder radius="md" padding="md">
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Stack gap={2}>
                <Text fw={600}>Execução</Text>
                <Text size="xs" c="dimmed">
                  {formatDate(run.created_at)}
                </Text>
              </Stack>

              <Group gap={6}>
                <Badge variant="light">{run.provider}</Badge>
                <Badge variant="light" color="gray">
                  {run.model}
                </Badge>
              </Group>
            </Group>

            <Divider />

            <Stack gap={6}>
              <Text size="xs" c="dimmed">
                Prompt
              </Text>
              <Text fw={600} style={{ lineHeight: 1.2 }}>
                {props.promptLabel}
              </Text>
            </Stack>

            <Divider />

            <Stack gap={6}>
              <Text size="xs" c="dimmed">
                Resultado (parseado)
              </Text>

              <Group gap={6} wrap="wrap">
                {score == null ? (
                  <Badge color="red" variant="light">
                    falhou
                  </Badge>
                ) : (
                  <Badge color={scoreColor(score)} variant="light">
                    score {score}
                  </Badge>
                )}

                {category ? (
                  <Badge color="gray" variant="light">
                    {category}
                  </Badge>
                ) : null}

                <Badge color="gray" variant="light">
                  conf. {formatConfidence(confidence)}
                </Badge>
              </Group>

              {tags ? (
                <Group gap={6} wrap="wrap">
                  {tags.map((t) => (
                    <Badge key={t} size="xs" variant="outline">
                      {t}
                    </Badge>
                  ))}
                </Group>
              ) : (
                <Text size="xs" c="dimmed">
                  Sem tags
                </Text>
              )}

              {rationale ? (
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {rationale}
                </Text>
              ) : null}
            </Stack>

            <Divider />

            <Stack gap="xs">
              <IdRow label="Run ID" value={run.id} />
              <IdRow label="Task ID" value={run.task_id} href={props.taskHref} hrefLabel="Abrir tarefa" />
              <IdRow label="Prompt ID" value={run.prompt_id} />
            </Stack>
          </Stack>
        </Card>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 8 }}>
        <Tabs defaultValue="prompt" variant="outline" radius="md">
          <Tabs.List>
            <Tabs.Tab value="prompt">
              <Group gap={6}>
                <IconFileText size={14} />
                <span>Prompt</span>
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="response">
              <Group gap={6}>
                <IconMessage size={14} />
                <span>Resposta</span>
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="json">
              <Group gap={6}>
                <IconBraces size={14} />
                <span>JSON</span>
              </Group>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="prompt" pt="sm">
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Text fw={600} size="sm">
                  Prompt renderizado
                </Text>
                <CopyAction value={run.rendered_prompt} ariaLabel="Copiar prompt renderizado" />
              </Group>
              <Textarea
                value={run.rendered_prompt}
                readOnly
                autosize
                minRows={10}
                maxRows={22}
                styles={monoInputStyles}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="response" pt="sm">
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Text fw={600} size="sm">
                  Resposta completa
                </Text>
                <CopyAction value={run.raw_response} ariaLabel="Copiar resposta completa" />
              </Group>
              <Textarea
                value={run.raw_response}
                readOnly
                autosize
                minRows={10}
                maxRows={22}
                styles={monoInputStyles}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="json" pt="sm">
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Text fw={600} size="sm">
                  Saída parseada
                </Text>
                <CopyAction value={parsedJson || "—"} ariaLabel="Copiar saída parseada" />
              </Group>
              <Textarea
                value={parsedJson || "—"}
                readOnly
                autosize
                minRows={10}
                maxRows={22}
                styles={monoInputStyles}
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Grid.Col>
    </Grid>
  );
}

export function LogsPageClient(props: {
  items: ScoringRunSummaryRow[];
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
  const [openedRunId, setOpenedRunId] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<Record<string, ScoringRunDetailRow>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
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

  function buildSearchParamsFrom(params: { filters: LogsFiltersValue; page: number }) {
    const sp = new URLSearchParams();
    if (returnTo) sp.set("returnTo", returnTo);
    if (params.filters.from?.trim()) sp.set("from", params.filters.from.trim());
    if (params.filters.to?.trim()) sp.set("to", params.filters.to.trim());
    if (params.filters.model?.trim()) sp.set("model", params.filters.model.trim());
    if (params.page > 1) sp.set("page", String(params.page));
    return sp;
  }

  function pushLogs(params: { filters: LogsFiltersValue; page: number }) {
    const qs = buildSearchParamsFrom(params).toString();
    startTransition(() => {
      router.push(qs ? `/dashboard/logs?${qs}` : "/dashboard/logs");
    });
  }

  function applyFilters() {
    pushLogs({ filters, page: 1 });
  }

  function clearFilters() {
    const cleared = { from: "", to: "", model: "" };
    setFilters(cleared);
    pushLogs({ filters: cleared, page: 1 });
  }

  const logsReturnTo = useMemo(() => {
    const sp = new URLSearchParams();
    const from = props.initialFilters.from?.trim();
    const to = props.initialFilters.to?.trim();
    const model = props.initialFilters.model?.trim();
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    if (model) sp.set("model", model);
    if (props.page > 1) sp.set("page", String(props.page));
    const qs = sp.toString();
    return qs ? `/dashboard/logs?${qs}` : "/dashboard/logs";
  }, [props.initialFilters.from, props.initialFilters.to, props.initialFilters.model, props.page]);

  const taskReturnTo = returnTo ?? logsReturnTo;

  const filterChips = (() => {
    const applied = props.initialFilters;
    const chips: React.ReactNode[] = [];

    const from = applied.from?.trim();
    const to = applied.to?.trim();
    if (from || to) {
      const dateLabel = from && to ? `${from} → ${to}` : from ? `≥ ${from}` : `≤ ${to}`;
      const nextApplied: LogsFiltersValue = { ...applied, from: "", to: "" };
      chips.push(
        <Badge
          key="date"
          variant="light"
          color="gray"
          rightSection={
            <ActionIcon
              variant="subtle"
              color="red"
              size="xs"
              radius="xl"
              aria-label="Remover filtro: Data"
              onClick={(e) => {
                e.stopPropagation();
                setFilters(nextApplied);
                pushLogs({ filters: nextApplied, page: 1 });
              }}
            >
              <IconX size={14} />
            </ActionIcon>
          }
        >
          Data: {dateLabel}
        </Badge>,
      );
    }

    const model = applied.model?.trim();
    if (model) {
      const nextApplied: LogsFiltersValue = { ...applied, model: "" };
      chips.push(
        <Badge
          key="model"
          variant="light"
          color="gray"
          rightSection={
            <ActionIcon
              variant="subtle"
              color="red"
              size="xs"
              radius="xl"
              aria-label="Remover filtro: Modelo"
              onClick={(e) => {
                e.stopPropagation();
                setFilters(nextApplied);
                pushLogs({ filters: nextApplied, page: 1 });
              }}
            >
              <IconX size={14} />
            </ActionIcon>
          }
        >
          Modelo: {model}
        </Badge>,
      );
    }

    return chips;
  })();

  const filterChipsCount = filterChips.length;
  const filtersSubtitle =
    filterChipsCount === 0
      ? "Nenhum filtro aplicado. Clique para filtrar."
      : filterChipsCount === 1
        ? "1 filtro ativo. Clique para editar."
        : `${filterChipsCount} filtros ativos. Clique para editar.`;

  useEffect(() => {
    setOpenedRunId(null);
    setRunDetails({});
    setDetailError(null);
    setDetailLoadingId(null);
  }, [props.page, props.total, props.initialFilters.from, props.initialFilters.to, props.initialFilters.model]);

  useEffect(() => {
    if (!openedRunId) return;
    if (runDetails[openedRunId]) return;

    const controller = new AbortController();
    const runId = openedRunId;
    setDetailLoadingId(runId);
    setDetailError(null);

    fetch(`/api/dashboard/runs/${runId}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message || `Falha ao carregar detalhes (HTTP ${res.status})`);
        }
        return (await res.json()) as { run: ScoringRunDetailRow };
      })
      .then((data) => {
        setRunDetails((current) => ({ ...current, [runId]: data.run }));
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setDetailError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        setDetailLoadingId((current) => (current === runId ? null : current));
      });

    return () => controller.abort();
  }, [openedRunId, runDetails]);

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

        <Card withBorder radius="md" padding={0}>
          <Box
            px="md"
            py="sm"
            role="button"
            tabIndex={0}
            aria-expanded={filtersOpen}
            aria-controls="logs-filters-panel"
            onClick={() => setFiltersOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setFiltersOpen((v) => !v);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <Group justify="space-between" align="center" wrap="wrap">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon variant="light" color="indigo" radius="md">
                  <IconAdjustments size={18} />
                </ThemeIcon>
                <Box>
                  <Group gap="xs">
                    <Text fw={600}>Filtros</Text>
                    {filterChipsCount ? (
                      <Badge size="xs" variant="light" color="indigo">
                        {filterChipsCount}
                      </Badge>
                    ) : null}
                  </Group>
                  <Text size="xs" c="dimmed">
                    {filtersSubtitle}
                  </Text>
                </Box>
              </Group>

              <ActionIcon
                variant="subtle"
                aria-label={filtersOpen ? "Recolher filtros" : "Expandir filtros"}
              >
                {filtersOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
              </ActionIcon>
            </Group>
          </Box>

          {filterChipsCount ? (
            <Box px="md" pb="sm">
              <Group gap={8} wrap="wrap">
                {filterChips}
              </Group>
            </Box>
          ) : null}

          <Collapse in={filtersOpen}>
            <Divider />
            <Box id="logs-filters-panel" px="md" py="md">
              <Grid align="flex-end" gutter="xs">
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <DateInput
                    label="De"
                    value={fromDate}
                    onChange={(date) => {
                      const nextFrom = formatYmdDate(date);
                      setFilters((current) => ({
                        ...current,
                        from: nextFrom,
                        to: nextFrom && current.to.trim() && current.to < nextFrom ? nextFrom : current.to,
                      }));
                    }}
                    valueFormat="DD/MM/YYYY"
                    maxDate={toDate ?? undefined}
                    clearable
                    size="sm"
                    leftSection={<IconCalendarEvent size={16} />}
                    leftSectionPointerEvents="none"
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
                        from: nextTo && current.from.trim() && current.from > nextTo ? nextTo : current.from,
                      }));
                    }}
                    valueFormat="DD/MM/YYYY"
                    minDate={fromDate ?? undefined}
                    clearable
                    size="sm"
                    leftSection={<IconCalendarEvent size={16} />}
                    leftSectionPointerEvents="none"
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
                    size="sm"
                    leftSection={<IconBrandOpenai size={16} />}
                    leftSectionPointerEvents="none"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Group justify="flex-end" gap="xs">
                    <Button size="xs" variant="default" leftSection={<IconX size={14} />} onClick={clearFilters}>
                      Limpar
                    </Button>
                    <Button size="xs" leftSection={<IconCheck size={14} />} onClick={applyFilters}>
                      Aplicar
                    </Button>
                  </Group>
                </Grid.Col>
              </Grid>
            </Box>
          </Collapse>
        </Card>

        <Text size="xs" c="dimmed">
          Clique em uma execução para ver o prompt, a resposta completa e a saída parseada.
        </Text>

        {props.items.length === 0 ? (
          <Card withBorder>
            <Text c="dimmed" size="sm">
              Nenhum log encontrado.
            </Text>
          </Card>
        ) : (
          <Accordion
            value={openedRunId}
            onChange={(value) => setOpenedRunId(typeof value === "string" ? value : null)}
            variant="separated"
            radius="md"
          >
            {props.items.map((run) => {
              const score = getScoreFromParsed(run.parsed_output);
              const promptLabel = run.prompt
                ? `${run.prompt.name} v${run.prompt.version}`
                : `Prompt v${run.prompt_version}`;
              const taskHref = `/dashboard/tasks/${run.task_id}?returnTo=${encodeURIComponent(taskReturnTo)}`;

              const loadedDetail = runDetails[run.id] ?? null;
              const isLoading = detailLoadingId === run.id && !loadedDetail;
              const showError = openedRunId === run.id && !loadedDetail && detailError;

              return (
                <Accordion.Item key={run.id} value={run.id}>
                  <Accordion.Control>
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                        <ThemeIcon variant="light" color="indigo" radius="md">
                          <IconFileText size={18} />
                        </ThemeIcon>

                        <Stack gap={2} style={{ minWidth: 0 }}>
                          <Group gap={8} wrap="wrap">
                            <Text fw={600} lineClamp={1} style={{ minWidth: 0 }}>
                              {promptLabel}
                            </Text>
                            <Badge size="xs" variant="light" color="gray">
                              {run.model}
                            </Badge>
                            <Badge size="xs" variant="light">
                              {run.provider}
                            </Badge>
                          </Group>

                          <Group gap={6} wrap="wrap">
                            <Text size="xs" c="dimmed">
                              {isCompact ? formatDateCompact(run.created_at) : formatDate(run.created_at)}
                            </Text>
                            <Text size="xs" c="dimmed">
                              •
                            </Text>
                            <Text size="xs" c="dimmed">
                              Relacionado a{" "}
                              <Anchor component={Link} href={taskHref} onClick={(e) => e.stopPropagation()} size="xs">
                                {run.task?.title || truncateId(run.task_id)}
                              </Anchor>
                            </Text>
                          </Group>
                        </Stack>
                      </Group>

                      {score == null ? (
                        <Badge color="red" variant="light">
                          falhou
                        </Badge>
                      ) : (
                        <Badge color={scoreColor(score)} variant="light">
                          score {score}
                        </Badge>
                      )}
                    </Group>
                  </Accordion.Control>

                  <Accordion.Panel>
                    {openedRunId === run.id ? (
                      <Stack gap="md">
                        {isLoading ? (
                          <Group gap="sm">
                            <Loader size="sm" color="indigo" />
                            <Text size="sm" c="dimmed">
                              Carregando detalhes da execução…
                            </Text>
                          </Group>
                        ) : showError ? (
                          <Card withBorder radius="md" padding="md">
                            <Text fw={600} c="red">
                              Falha ao carregar detalhes
                            </Text>
                            <Text size="sm" c="dimmed">
                              {detailError}
                            </Text>
                          </Card>
                        ) : loadedDetail ? (
                          <RunDetailView run={loadedDetail} taskHref={taskHref} promptLabel={promptLabel} />
                        ) : (
                          <Text size="sm" c="dimmed">
                            Selecione a execução para carregar os detalhes.
                          </Text>
                        )}
                      </Stack>
                    ) : null}
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        )}

        <Group justify="center">
          <Pagination value={props.page} total={totalPages} onChange={(p) => pushLogs({ filters, page: p })} />
        </Group>
      </Stack>
    </Box>
  );
}

