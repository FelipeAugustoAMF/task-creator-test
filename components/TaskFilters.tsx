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
  { value: "", label: "All" },
  { value: "incident", label: "incident" },
  { value: "bug", label: "bug" },
  { value: "feature", label: "feature" },
  { value: "ops", label: "ops" },
  { value: "finance", label: "finance" },
  { value: "support", label: "support" },
  { value: "other", label: "other" },
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
          label="Search"
          placeholder="Title or description"
          value={props.value.search}
          onChange={(e) => props.onChange({ ...props.value, search: e.currentTarget.value })}
          style={{ flex: 1 }}
        />

        <Select
          label="Category"
          data={categoryOptions}
          value={props.value.category}
          onChange={(value) => props.onChange({ ...props.value, category: value || "" })}
          w={200}
        />

        <NumberInput
          label="Score min"
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
          label="Score max"
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
          Clear
        </Button>
        <Button onClick={props.onApply}>Apply</Button>
      </Group>
    </Stack>
  );
}

