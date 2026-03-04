"use client";

import {
  AppShell,
  Burger,
  Container,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Stack gap={0}>
              <Title order={3}>The Hybrid Architect</Title>
              <Text size="xs" c="dimmed">
                Prioridade com IA
              </Text>
            </Stack>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section component={ScrollArea} grow>
          <NavLink
            component={Link}
            href="/dashboard"
            label="Tarefas"
            active={pathname === "/dashboard" || pathname.startsWith("/dashboard/tasks")}
            onClick={close}
          />
          <NavLink
            component={Link}
            href="/dashboard/logs"
            label="Logs"
            active={pathname.startsWith("/dashboard/logs")}
            onClick={close}
          />
        </AppShell.Section>

        <AppShell.Section>
          <Text size="xs" c="dimmed">
            MVP • Next.js + Mantine + Supabase + OpenAI
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg">{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
