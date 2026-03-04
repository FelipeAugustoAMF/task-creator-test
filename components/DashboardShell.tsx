"use client";

import {
  ActionIcon,
  AppShell,
  Burger,
  Container,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  Title,
} from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [opened, { toggle, close }] = useDisclosure();
  const [collapsed, setCollapsed] = useLocalStorage({
    key: "tha_nav_collapsed",
    defaultValue: false,
  });

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: collapsed ? 84 : 260,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
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

      <AppShell.Navbar p={collapsed ? "xs" : "md"}>
        <AppShell.Section mb="sm">
          <Group justify={collapsed ? "center" : "space-between"}>
            {!collapsed && (
              <Text size="sm" fw={600}>
                Navegação
              </Text>
            )}
            <ActionIcon
              variant="subtle"
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? "»" : "«"}
            </ActionIcon>
          </Group>
        </AppShell.Section>

        <AppShell.Section component={ScrollArea} grow>
          <Tooltip
            label="Tarefas"
            position="right"
            withArrow
            disabled={!collapsed}
          >
            <NavLink
              component={Link}
              href="/dashboard"
              label={collapsed ? undefined : "Tarefas"}
              leftSection={
                <ThemeIcon variant="light" color="indigo" radius="md" size={32}>
                  <Text fw={700} size="sm">
                    T
                  </Text>
                </ThemeIcon>
              }
              active={pathname === "/dashboard" || pathname.startsWith("/dashboard/tasks")}
              onClick={close}
              styles={
                collapsed
                  ? {
                      root: { justifyContent: "center" },
                      body: { display: "none" },
                      section: { marginInlineEnd: 0 },
                    }
                  : undefined
              }
            />
          </Tooltip>

          <Tooltip label="Logs" position="right" withArrow disabled={!collapsed}>
            <NavLink
              component={Link}
              href="/dashboard/logs"
              label={collapsed ? undefined : "Logs"}
              leftSection={
                <ThemeIcon variant="light" color="indigo" radius="md" size={32}>
                  <Text fw={700} size="sm">
                    L
                  </Text>
                </ThemeIcon>
              }
              active={pathname.startsWith("/dashboard/logs")}
              onClick={close}
              styles={
                collapsed
                  ? {
                      root: { justifyContent: "center" },
                      body: { display: "none" },
                      section: { marginInlineEnd: 0 },
                    }
                  : undefined
              }
            />
          </Tooltip>
        </AppShell.Section>

        <AppShell.Section>
          {!collapsed && (
            <Text size="xs" c="dimmed">
              MVP • Next.js + Mantine + Supabase + OpenAI
            </Text>
          )}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg">{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
