"use client";

import {
  Button,
  Divider,
  Grid,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import React from "react";

import { formatYmdDate, parseYmdDate } from "@/lib/dates/ymd";
import {
  ALLOWED_TAG_OPTIONS,
  SCORING_CATEGORY_LABELS,
  SCORING_CATEGORY_VALUES,
} from "@/lib/scoring/taxonomy";
import { DEFAULT_TASK_PAGE_SIZE } from "@/lib/tasks/query";

export type TaskFiltersValue = {
  search: string;
  completion: "" | "pending" | "completed";
  category: string;
  scoreMin?: number;
  scoreMax?: number;
  from: string;
  to: string;
  tags: string[];
  pageSize: number;
};

const categoryOptions = [
  { value: "", label: "Todas" },
  ...SCORING_CATEGORY_VALUES.map((value) => ({
    value,
    label: SCORING_CATEGORY_LABELS[value],
  })),
];

const completionOptions = [
  { value: "", label: "Todas" },
  { value: "pending", label: "Pendentes" },
  { value: "completed", label: "Concluídas" },
];

const pageSizeOptions = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

export function TaskFilters(props: {
  value: TaskFiltersValue;
  onChange: (next: TaskFiltersValue) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  const fromDate = parseYmdDate(props.value.from);
  const toDate = parseYmdDate(props.value.to);

  return (
    <Stack gap="md">
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label="Título"
            placeholder="Título ou descrição"
            value={props.value.search}
            onChange={(e) => props.onChange({ ...props.value, search: e.currentTarget.value })}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 3 }}>
          <Select
            label="Status"
            placeholder="Todas"
            data={completionOptions}
            value={props.value.completion}
            onChange={(value) =>
              props.onChange({
                ...props.value,
                completion: (value as TaskFiltersValue["completion"]) || "",
              })
            }
            allowDeselect={false}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 3 }}>
          <Select
            label="Categoria"
            data={categoryOptions}
            value={props.value.category}
            onChange={(value) => props.onChange({ ...props.value, category: value || "" })}
            clearable
            searchable
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12 }}>
          <MultiSelect
            label="Tags"
            placeholder="Selecione…"
            data={ALLOWED_TAG_OPTIONS}
            value={props.value.tags}
            onChange={(value) => props.onChange({ ...props.value, tags: value })}
            searchable
            clearable
            nothingFoundMessage="Nenhuma tag encontrada"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Group grow>
            <NumberInput
              label="Score mín."
              placeholder="1"
              min={1}
              max={10}
              clampBehavior="strict"
              value={props.value.scoreMin ?? ""}
              onChange={(value) =>
                props.onChange({
                  ...props.value,
                  scoreMin: typeof value === "number" ? value : undefined,
                })
              }
            />

            <NumberInput
              label="Score máx."
              placeholder="10"
              min={1}
              max={10}
              clampBehavior="strict"
              value={props.value.scoreMax ?? ""}
              onChange={(value) =>
                props.onChange({
                  ...props.value,
                  scoreMax: typeof value === "number" ? value : undefined,
                })
              }
            />
          </Group>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Group grow>
            <DateInput
              label="De"
              value={fromDate}
              onChange={(date) => {
                const nextFrom = formatYmdDate(date);
                props.onChange({
                  ...props.value,
                  from: nextFrom,
                  to:
                    nextFrom && props.value.to.trim() && props.value.to < nextFrom
                      ? nextFrom
                      : props.value.to,
                });
              }}
              valueFormat="DD/MM/YYYY"
              maxDate={toDate ?? undefined}
              clearable
            />
            <DateInput
              label="Até"
              value={toDate}
              onChange={(date) => {
                const nextTo = formatYmdDate(date);
                props.onChange({
                  ...props.value,
                  to: nextTo,
                  from:
                    nextTo && props.value.from.trim() && props.value.from > nextTo
                      ? nextTo
                      : props.value.from,
                });
              }}
              valueFormat="DD/MM/YYYY"
              minDate={fromDate ?? undefined}
              clearable
            />
          </Group>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            label="Resultados por página"
            data={pageSizeOptions}
            value={String(props.value.pageSize || DEFAULT_TASK_PAGE_SIZE)}
            onChange={(value) =>
              props.onChange({
                ...props.value,
                pageSize: value ? Number(value) : DEFAULT_TASK_PAGE_SIZE,
              })
            }
            allowDeselect={false}
          />
        </Grid.Col>
      </Grid>

      <Divider />

      <Group justify="flex-start">
        <Button variant="default" onClick={props.onClear}>
          Remover
        </Button>
        <Button onClick={props.onApply}>Aplicar</Button>
      </Group>
    </Stack>
  );
}
