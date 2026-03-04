"use client";

import { Button, Group, NumberInput, Select, Stack, TextInput } from "@mantine/core";
import React from "react";

export type TaskFiltersValue = {
  search: string;
  category: string;
  scoreMin?: number;
  scoreMax?: number;
};

const categoryOptions = [
  { value: "", label: "Todas" },
  { value: "incidente", label: "Incidente" },
  { value: "defeito", label: "Defeito" },
  { value: "melhoria", label: "Melhoria" },
  { value: "manutenção", label: "Manutenção" },
  { value: "segurança", label: "Segurança" },
  { value: "financeiro", label: "Financeiro" },
  { value: "suporte", label: "Suporte" },
  { value: "administrativo", label: "Administrativo" },
  { value: "pessoal", label: "Pessoal" },
  { value: "outro", label: "Outro" },
];

export function TaskFilters(props: {
  value: TaskFiltersValue;
  onChange: (next: TaskFiltersValue) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <Stack gap="sm">
      <Group align="flex-end">
        <TextInput
          label="Busca"
          placeholder="Título ou descrição"
          value={props.value.search}
          onChange={(e) => props.onChange({ ...props.value, search: e.currentTarget.value })}
          style={{ flex: 1 }}
        />

        <Select
          label="Categoria"
          data={categoryOptions}
          value={props.value.category}
          onChange={(value) => props.onChange({ ...props.value, category: value || "" })}
          w={200}
        />

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
          w={120}
        />

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
          w={120}
        />
      </Group>

      <Group justify="flex-end">
        <Button variant="default" onClick={props.onClear}>
          Limpar
        </Button>
        <Button onClick={props.onApply}>Aplicar</Button>
      </Group>
    </Stack>
  );
}
