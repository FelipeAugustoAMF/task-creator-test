"use client";

import {
  Button,
  Grid,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import React from "react";

import {
  ALLOWED_TAG_OPTIONS,
  SCORING_CATEGORY_LABELS,
  SCORING_CATEGORY_VALUES,
} from "@/lib/scoring/taxonomy";

export type TaskFiltersValue = {
  search: string;
  category: string;
  scoreMin?: number;
  scoreMax?: number;
  from: string;
  to: string;
  tags: string[];
};

const categoryOptions = [
  { value: "", label: "Todas" },
  ...SCORING_CATEGORY_VALUES.map((value) => ({
    value,
    label: SCORING_CATEGORY_LABELS[value],
  })),
];

export function TaskFilters(props: {
  value: TaskFiltersValue;
  onChange: (next: TaskFiltersValue) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <Stack gap="sm">
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
          label="Busca"
          placeholder="Título ou descrição"
          value={props.value.search}
          onChange={(e) => props.onChange({ ...props.value, search: e.currentTarget.value })}
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

        <Grid.Col span={{ base: 12, md: 3 }}>
          <MultiSelect
            label="Tags"
            placeholder="Selecione…"
            data={ALLOWED_TAG_OPTIONS}
            value={props.value.tags}
            onChange={(value) => props.onChange({ ...props.value, tags: value })}
            searchable
            clearable
          />
        </Grid.Col>

        <Grid.Col span={{ base: 6, md: 3 }}>
          <NumberInput
          label="Score mínimo"
          min={1}
          max={10}
          clampBehavior="strict"
          value={props.value.scoreMin}
          onChange={(value) =>
            props.onChange({
              ...props.value,
              scoreMin: typeof value === "number" ? value : undefined,
            })
          }
        />
        </Grid.Col>

        <Grid.Col span={{ base: 6, md: 3 }}>
          <NumberInput
          label="Score máximo"
          min={1}
          max={10}
          clampBehavior="strict"
          value={props.value.scoreMax}
          onChange={(value) =>
            props.onChange({
              ...props.value,
              scoreMax: typeof value === "number" ? value : undefined,
            })
          }
        />
        </Grid.Col>

        <Grid.Col span={{ base: 6, md: 3 }}>
          <TextInput
            type="date"
            label="De"
            value={props.value.from}
            onChange={(e) => props.onChange({ ...props.value, from: e.currentTarget.value })}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 6, md: 3 }}>
          <TextInput
            type="date"
            label="Até"
            value={props.value.to}
            onChange={(e) => props.onChange({ ...props.value, to: e.currentTarget.value })}
          />
        </Grid.Col>
      </Grid>

      <Group justify="flex-end">
        <Button variant="default" onClick={props.onClear}>
          Limpar
        </Button>
        <Button onClick={props.onApply}>Aplicar</Button>
      </Group>
    </Stack>
  );
}
