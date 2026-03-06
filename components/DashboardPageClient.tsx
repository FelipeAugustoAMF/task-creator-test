"use client";

import {
  Affix,
  ActionIcon,
  Badge,
  Button,
  Box,
  Card,
  Collapse,
  Divider,
  Group,
  LoadingOverlay,
  Pagination,
  Stack,
  Transition,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useMediaQuery, useWindowScroll } from "@mantine/hooks";
import {
  IconAdjustments,
  IconCalendar,
  IconChevronDown,
  IconChevronUp,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { TaskFormModal } from "@/components/TaskFormModal";
import { TaskFilters, TaskFiltersValue } from "@/components/TaskFilters";
import { TaskTable } from "@/components/TaskTable";
import { ALLOWED_TAG_LABELS, SCORING_CATEGORY_LABELS } from "@/lib/scoring/taxonomy";
import {
  DEFAULT_TASK_PAGE_SIZE,
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [taskOpening, setTaskOpening] = useState(false);
  const isCompact = useMediaQuery("(max-width: 36em)");
  const [scroll] = useWindowScroll();
  const todayDate = useMemo(() => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);
  const todayOnlyApplied =
    props.initialFilters.from?.trim() === todayDate && props.initialFilters.to?.trim() === todayDate;

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

  const chipStyles = {
    root: { alignItems: "center" },
    section: { display: "flex", alignItems: "center" },
    label: { display: "flex", alignItems: "center" },
  } as const;

  function chipRemoveButton(params: { ariaLabel: string; onRemove: () => void }) {
    return (
      <ActionIcon
        variant="subtle"
        color="red"
        size="xs"
        radius="xl"
        aria-label={params.ariaLabel}
        onClick={(e) => {
          e.stopPropagation();
          params.onRemove();
        }}
        style={{ alignSelf: "center" }}
      >
        <IconX size={14} />
      </ActionIcon>
    );
  }

  function buildSearchParamsFrom(params: {
    filters: TaskFiltersValue;
    page: number;
    sortBy: TaskSortBy;
    sortDir: TaskSortDir;
  }) {
    const sp = new URLSearchParams();
    const f = params.filters;

    if (f.search?.trim()) sp.set("search", f.search.trim());
    if (f.completion?.trim()) sp.set("completion", f.completion.trim());
    if (f.category?.trim()) sp.set("category", f.category.trim());
    if (f.tags?.length) sp.set("tags", f.tags.join(","));
    if (typeof f.scoreMin === "number") sp.set("scoreMin", String(f.scoreMin));
    if (typeof f.scoreMax === "number") sp.set("scoreMax", String(f.scoreMax));
    if (f.from?.trim()) sp.set("from", f.from.trim());
    if (f.to?.trim()) sp.set("to", f.to.trim());
    if ((f.pageSize || DEFAULT_TASK_PAGE_SIZE) !== DEFAULT_TASK_PAGE_SIZE) {
      sp.set("pageSize", String(f.pageSize));
    }

    if (
      params.sortBy !== DEFAULT_TASK_SORT_BY ||
      params.sortDir !== DEFAULT_TASK_SORT_DIR
    ) {
      sp.set("sortBy", params.sortBy);
      sp.set("sortDir", params.sortDir);
    }

    if (params.page > 1) sp.set("page", String(params.page));

    return sp;
  }

  const dashboardReturnTo = useMemo(() => {
    const sp = buildSearchParamsFrom({
      filters: props.initialFilters,
      page: props.page,
      sortBy: props.initialSort.sortBy,
      sortDir: props.initialSort.sortDir,
    });

    const qs = sp.toString();
    return qs ? `/dashboard?${qs}` : "/dashboard";
  }, [
    props.initialFilters,
    props.initialSort.sortBy,
    props.initialSort.sortDir,
    props.page,
  ]);

  function buildSearchParams(
    next: { page?: number; sortBy?: TaskSortBy; sortDir?: TaskSortDir } = {},
  ) {
    return buildSearchParamsFrom({
      filters,
      page: next.page ?? props.page,
      sortBy: next.sortBy ?? sortBy,
      sortDir: next.sortDir ?? sortDir,
    });
  }

  function pushDashboard(sp: URLSearchParams) {
    const qs = sp.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  function applyFilters() {
    pushDashboard(buildSearchParams({ page: 1 }));
  }

  function toggleTodayOnly() {
    const applied = props.initialFilters;
    const nextApplied: TaskFiltersValue = todayOnlyApplied
      ? { ...applied, from: "", to: "" }
      : { ...applied, from: todayDate, to: todayDate };

    setFilters(nextApplied);
    pushDashboard(
      buildSearchParamsFrom({
        filters: nextApplied,
        page: 1,
        sortBy,
        sortDir,
      }),
    );
  }

  function clearFilters() {
    setFilters({
      search: "",
      completion: "",
      category: "",
      scoreMin: undefined,
      scoreMax: undefined,
      from: "",
      to: "",
      tags: [],
      pageSize: DEFAULT_TASK_PAGE_SIZE,
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
    pushDashboard(buildSearchParams({ page: 1, sortBy: nextBy, sortDir: nextDir }));
  }

  const appliedChips = (() => {
    const applied = props.initialFilters;
    const appliedSort = props.initialSort;
    const chips: React.ReactNode[] = [];

    const search = applied.search?.trim();
    if (search) {
      const nextApplied: TaskFiltersValue = { ...applied, search: "" };
      chips.push(
        <Badge
          key="search"
          variant="light"
          color="gray"
          rightSection={
            chipRemoveButton({
              ariaLabel: "Remover filtro: Título",
              onRemove: () => {
                setFilters(nextApplied);
                pushDashboard(
                  buildSearchParamsFrom({
                    filters: nextApplied,
                    page: 1,
                    sortBy: appliedSort.sortBy,
                    sortDir: appliedSort.sortDir,
                  }),
                );
              },
            })
          }
          styles={chipStyles}
        >
          Título: {search}
        </Badge>,
      );
    }

    const completion = applied.completion?.trim();
    if (completion) {
      const completionLabel =
        completion === "pending"
          ? "Pendentes"
          : completion === "completed"
            ? "Concluídas"
            : completion;
      const nextApplied: TaskFiltersValue = { ...applied, completion: "" };
      chips.push(
        <Badge
          key="completion"
          variant="light"
          color="gray"
          rightSection={
            chipRemoveButton({
              ariaLabel: "Remover filtro: Status",
              onRemove: () => {
                setFilters(nextApplied);
                pushDashboard(
                  buildSearchParamsFrom({
                    filters: nextApplied,
                    page: 1,
                    sortBy: appliedSort.sortBy,
                    sortDir: appliedSort.sortDir,
                  }),
                );
              },
            })
          }
          styles={chipStyles}
        >
          Status: {completionLabel}
        </Badge>,
      );
    }

    const category = applied.category?.trim();
    if (category) {
      const categoryLabel = (SCORING_CATEGORY_LABELS as Record<string, string>)[category] || category;
      const nextApplied: TaskFiltersValue = { ...applied, category: "" };
      chips.push(
        <Badge
          key="category"
          variant="light"
          color="gray"
          rightSection={
            chipRemoveButton({
              ariaLabel: "Remover filtro: Categoria",
              onRemove: () => {
                setFilters(nextApplied);
                pushDashboard(
                  buildSearchParamsFrom({
                    filters: nextApplied,
                    page: 1,
                    sortBy: appliedSort.sortBy,
                    sortDir: appliedSort.sortDir,
                  }),
                );
              },
            })
          }
          styles={chipStyles}
        >
          Categoria: {categoryLabel}
        </Badge>,
      );
    }

    if (applied.tags?.length) {
      for (const t of applied.tags) {
        const label = (ALLOWED_TAG_LABELS as Record<string, string>)[t] || t;
        const nextApplied: TaskFiltersValue = { ...applied, tags: applied.tags.filter((x) => x !== t) };
        chips.push(
          <Badge
            key={`tag:${t}`}
            variant="light"
            color="indigo"
            rightSection={
              chipRemoveButton({
                ariaLabel: `Remover tag: ${label}`,
                onRemove: () => {
                  setFilters(nextApplied);
                  pushDashboard(
                    buildSearchParamsFrom({
                      filters: nextApplied,
                      page: 1,
                      sortBy: appliedSort.sortBy,
                      sortDir: appliedSort.sortDir,
                    }),
                  );
                },
              })
            }
            styles={chipStyles}
          >
            {label}
          </Badge>,
        );
      }
    }

    const scoreMin = applied.scoreMin;
    const scoreMax = applied.scoreMax;
    if (typeof scoreMin === "number" || typeof scoreMax === "number") {
      const scoreLabel =
        typeof scoreMin === "number" && typeof scoreMax === "number"
          ? `${scoreMin}–${scoreMax}`
          : typeof scoreMin === "number"
            ? `≥ ${scoreMin}`
            : `≤ ${scoreMax}`;

      const nextApplied: TaskFiltersValue = { ...applied, scoreMin: undefined, scoreMax: undefined };
      chips.push(
        <Badge
          key="score"
          variant="light"
          color="gray"
          rightSection={
            chipRemoveButton({
              ariaLabel: "Remover filtro: Score",
              onRemove: () => {
                setFilters(nextApplied);
                pushDashboard(
                  buildSearchParamsFrom({
                    filters: nextApplied,
                    page: 1,
                    sortBy: appliedSort.sortBy,
                    sortDir: appliedSort.sortDir,
                  }),
                );
              },
            })
          }
          styles={chipStyles}
        >
          Score: {scoreLabel}
        </Badge>,
      );
    }

    const from = applied.from?.trim();
    const to = applied.to?.trim();
    if (from || to) {
      const dateLabel = from && to ? `${from} → ${to}` : from ? `≥ ${from}` : `≤ ${to}`;
      const nextApplied: TaskFiltersValue = { ...applied, from: "", to: "" };
      chips.push(
        <Badge
          key="date"
          variant="light"
          color="gray"
          rightSection={
            chipRemoveButton({
              ariaLabel: "Remover filtro: Data",
              onRemove: () => {
                setFilters(nextApplied);
                pushDashboard(
                  buildSearchParamsFrom({
                    filters: nextApplied,
                    page: 1,
                    sortBy: appliedSort.sortBy,
                    sortDir: appliedSort.sortDir,
                  }),
                );
              },
            })
          }
          styles={chipStyles}
        >
          Data: {dateLabel}
        </Badge>,
      );
    }

    if ((applied.pageSize || DEFAULT_TASK_PAGE_SIZE) !== DEFAULT_TASK_PAGE_SIZE) {
      const nextApplied: TaskFiltersValue = { ...applied, pageSize: DEFAULT_TASK_PAGE_SIZE };
      chips.push(
        <Badge
          key="pageSize"
          variant="light"
          color="gray"
          rightSection={
            chipRemoveButton({
              ariaLabel: "Remover filtro: Resultados por página",
              onRemove: () => {
                setFilters(nextApplied);
                pushDashboard(
                  buildSearchParamsFrom({
                    filters: nextApplied,
                    page: 1,
                    sortBy: appliedSort.sortBy,
                    sortDir: appliedSort.sortDir,
                  }),
                );
              },
            })
          }
          styles={chipStyles}
        >
          Por página: {applied.pageSize}
        </Badge>,
      );
    }

    if (appliedSort.sortBy !== DEFAULT_TASK_SORT_BY || appliedSort.sortDir !== DEFAULT_TASK_SORT_DIR) {
      const sortByLabelMap: Record<TaskSortBy, string> = {
        created_at: "Data",
        score: "Score",
        title: "Título",
      };
      const dirSymbol = appliedSort.sortDir === "asc" ? "↑" : "↓";
      chips.push(
        <Badge
          key="sort"
          variant="light"
          color="gray"
          rightSection={
            chipRemoveButton({
              ariaLabel: "Remover ordenação personalizada",
              onRemove: () => {
                setSortBy(DEFAULT_TASK_SORT_BY);
                setSortDir(DEFAULT_TASK_SORT_DIR);
                pushDashboard(
                  buildSearchParamsFrom({
                    filters: applied,
                    page: 1,
                    sortBy: DEFAULT_TASK_SORT_BY,
                    sortDir: DEFAULT_TASK_SORT_DIR,
                  }),
                );
              },
            })
          }
          styles={chipStyles}
        >
          Ordenação: {sortByLabelMap[appliedSort.sortBy]} {dirSymbol}
        </Badge>,
      );
    }

    return chips;
  })();

  const appliedChipsCount = appliedChips.length;
  const filtersSubtitle =
    appliedChipsCount === 0
      ? "Nenhum filtro aplicado. Clique para filtrar."
      : appliedChipsCount === 1
        ? "1 filtro ativo. Clique para editar."
      : `${appliedChipsCount} filtros ativos. Clique para editar.`;

  const showFloatingCreate = scroll.y > 160;

  return (
    <Box pos="relative" mih="100vh">
      <LoadingOverlay
        visible={taskOpening}
        zIndex={3000}
        overlayProps={{ backgroundOpacity: 0.35, blur: 2 }}
        loaderProps={{ color: "indigo", size: "lg" }}
      />

      <Affix position={{ bottom: 20, right: 20 }} zIndex={2000}>
        <Transition mounted={showFloatingCreate} transition="slide-up" duration={200} timingFunction="ease">
          {(styles) =>
            isCompact ? (
              <ActionIcon
                variant="filled"
                color="indigo"
                radius="xl"
                size="xl"
                aria-label="Nova tarefa"
                style={styles}
                onClick={() => setModalOpen(true)}
              >
                <IconPlus size={20} />
              </ActionIcon>
            ) : (
              <Button
                leftSection={<IconPlus size={16} />}
                radius="xl"
                color="indigo"
                style={styles}
                onClick={() => setModalOpen(true)}
              >
                Nova tarefa
              </Button>
            )
          }
        </Transition>
      </Affix>

      <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={2}>
          <Title order={2}>Tarefas</Title>
          <Text c="dimmed" size="sm">
            {props.total} no total
          </Text>
        </Stack>

        <Button onClick={() => setModalOpen(true)} leftSection={<IconPlus size={16} />}>
          Nova tarefa
        </Button>
      </Group>

      <Card withBorder radius="md" padding={0}>
        <Box
          px="md"
          py="sm"
          role="button"
          tabIndex={0}
          aria-expanded={filtersOpen}
          aria-controls="task-filters-panel"
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
                  {appliedChipsCount ? (
                    <Badge size="xs" variant="light" color="indigo">
                      {appliedChipsCount}
                    </Badge>
                  ) : null}
                </Group>
                <Text size="xs" c="dimmed">
                  {filtersSubtitle}
                </Text>
              </Box>
            </Group>

            <Group gap="xs">
              <Button
                size="xs"
                variant={todayOnlyApplied ? "filled" : "light"}
                color="indigo"
                radius="xl"
                leftSection={<IconCalendar size={14} />}
                aria-pressed={todayOnlyApplied}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTodayOnly();
                }}
              >
                Tarefas de Hoje
              </Button>
              <ActionIcon
                variant="subtle"
                aria-label={filtersOpen ? "Recolher filtros" : "Expandir filtros"}
              >
                {filtersOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
              </ActionIcon>
            </Group>
          </Group>
        </Box>

        {appliedChipsCount ? (
          <Box px="md" pb="sm">
            <Group gap={8} wrap="wrap">
              {appliedChips}
            </Group>
          </Box>
        ) : null}

        <Collapse in={filtersOpen}>
          <Divider />
          <Box id="task-filters-panel" px="md" py="md">
            <TaskFilters value={filters} onChange={setFilters} onApply={applyFilters} onClear={clearFilters} />
          </Box>
        </Collapse>
      </Card>

      <Text size="xs" c="dimmed">
        Dica: clique em uma tarefa para abrir os detalhes (pode demorar alguns segundos).
      </Text>

      <TaskTable
        tasks={props.items}
        returnTo={dashboardReturnTo}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={onSortChange}
        onOpenTask={() => setTaskOpening(true)}
      />

      <Group justify="center">
        <Pagination
          value={props.page}
          total={totalPages}
          onChange={(p) => pushDashboard(buildSearchParams({ page: p }))}
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
    </Box>
  );
}
