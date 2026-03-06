"use client";

import { Accordion, Badge, Card, Group, Stack, Text, Textarea } from "@mantine/core";
import React from "react";

import { ScoringRunRow } from "@/lib/tasks/types";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

export function PromptRunViewer(props: { runs: ScoringRunRow[] }) {
  if (props.runs.length === 0) {
    return (
      <Card withBorder>
        <Text c="dimmed" size="sm">
          Nenhum log de scoring ainda.
        </Text>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Accordion variant="separated" multiple>
        {props.runs.map((run) => {
          const parsed =
            run.parsed_output && typeof run.parsed_output === "object"
              ? JSON.stringify(run.parsed_output, null, 2)
              : run.parsed_output
                ? String(run.parsed_output)
                : "";

          return (
            <Accordion.Item key={run.id} value={run.id}>
              <Accordion.Control>
                <Group justify="space-between" w="100%">
                  <Group gap="xs">
                    <Badge variant="light">{run.provider}</Badge>
                    <Badge variant="light" color="gray">
                      {run.model}
                    </Badge>
                    <Badge variant="light" color="gray">
                      v{run.prompt_version}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {formatDate(run.created_at)}
                  </Text>
                </Group>
              </Accordion.Control>

              <Accordion.Panel>
                <Stack gap="sm">
                  <Textarea
                    label="Prompt renderizado"
                    value={run.rendered_prompt}
                    readOnly
                    autosize
                    minRows={6}
                  />
                  <Textarea
                    label="Resposta bruta"
                    value={run.raw_response}
                    readOnly
                    autosize
                    minRows={6}
                  />
                  <Textarea
                    label="Saída parseada"
                    value={parsed || "—"}
                    readOnly
                    autosize
                    minRows={6}
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </Stack>
  );
}
