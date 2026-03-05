import { Card, Group, Loader, Skeleton, Stack, Text } from "@mantine/core";
import React from "react";

export default function TaskDetailLoading() {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Stack gap={4}>
          <Skeleton height={22} width={260} radius="sm" />
          <Text size="sm" c="dimmed">
            Abrindo detalhes da tarefa…
          </Text>
        </Stack>
        <Loader size="sm" />
      </Group>

      <Card withBorder>
        <Stack gap="sm">
          <Skeleton height={14} width="40%" radius="sm" />
          <Skeleton height={14} width="55%" radius="sm" />
          <Skeleton height={14} width="35%" radius="sm" />
          <Skeleton height={120} radius="sm" />
        </Stack>
      </Card>
    </Stack>
  );
}

