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
  Title,
} from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure();
  const [desktopOpened, setDesktopOpened] = useLocalStorage({
    key: "tha_nav_desktop_open",
    defaultValue: true,
  });

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 260,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
            <Burger
              opened={desktopOpened}
              onClick={() => setDesktopOpened((v) => !v)}
              visibleFrom="sm"
              size="sm"
            />
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
        <AppShell.Section mb="sm">
          <Group justify="space-between">
            <Text size="sm" fw={600}>
              Navegação
            </Text>
            <ActionIcon
              variant="subtle"
              aria-label={desktopOpened ? "Recolher menu" : "Expandir menu"}
              onClick={() => setDesktopOpened((v) => !v)}
              visibleFrom="sm"
            >
              {desktopOpened ? "«" : "»"}
            </ActionIcon>
          </Group>
        </AppShell.Section>

        <AppShell.Section component={ScrollArea} grow>
          <NavLink
            component={Link}
            href="/dashboard"
            label="Tarefas"
            leftSection={
              <ThemeIcon variant="light" color="indigo" radius="md" size={32}>
                <Text fw={700} size="sm">
                  T
                </Text>
              </ThemeIcon>
            }
            active={pathname === "/dashboard" || pathname.startsWith("/dashboard/tasks")}
            onClick={closeMobile}
          />

          <NavLink
            component={Link}
            href="/dashboard/logs"
            label="Logs"
            leftSection={
              <ThemeIcon variant="light" color="indigo" radius="md" size={32}>
                <Text fw={700} size="sm">
                  L
                </Text>
              </ThemeIcon>
            }
            active={pathname.startsWith("/dashboard/logs")}
            onClick={closeMobile}
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
