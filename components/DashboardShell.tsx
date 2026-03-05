"use client";

import {
  AppShell,
  Burger,
  Divider,
  Drawer,
  Container,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";

function coerceReturnTo(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  return v.startsWith("/dashboard") ? v : null;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [desktopNavbarOpened, { toggle: toggleDesktopNavbar }] = useDisclosure(true);

  const currentQuery = searchParams.toString();
  const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;
  const returnTo = coerceReturnTo(searchParams.get("returnTo"));

  const tasksHref = returnTo ?? (pathname === "/dashboard" ? currentUrl : "/dashboard");

  const logsHref = (() => {
    const sp = new URLSearchParams();
    if (tasksHref.startsWith("/dashboard")) sp.set("returnTo", tasksHref);
    const qs = sp.toString();
    return qs ? `/dashboard/logs?${qs}` : "/dashboard/logs";
  })();

  useEffect(() => {
    closeDrawer();
  }, [closeDrawer, pathname]);

  const mainNavLinks = (
    <Stack gap="xs">
      <NavLink
        component={Link}
        href={tasksHref}
        label="Tarefas"
        leftSection={
          <ThemeIcon variant="light" color="indigo" radius="md" size={32}>
            <Text fw={700} size="sm">
              T
            </Text>
          </ThemeIcon>
        }
        active={pathname === "/dashboard" || pathname.startsWith("/dashboard/tasks")}
        onClick={closeDrawer}
      />

      <NavLink
        component={Link}
        href={logsHref}
        label="Logs"
        leftSection={
          <ThemeIcon variant="light" color="indigo" radius="md" size={32}>
            <Text fw={700} size="sm">
              L
            </Text>
          </ThemeIcon>
        }
        active={pathname.startsWith("/dashboard/logs")}
        onClick={closeDrawer}
      />
    </Stack>
  );

  const logoutNavLink = (
    <NavLink
      component={Link}
      href="/logout"
      label="Sair"
      leftSection={
        <ThemeIcon variant="light" color="gray" radius="md" size={32}>
          <Text fw={700} size="sm">
            ←
          </Text>
        </ThemeIcon>
      }
      onClick={closeDrawer}
    />
  );

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 260,
        breakpoint: "md",
        collapsed: { mobile: true, desktop: !desktopNavbarOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="sm">
          <Burger
            opened={drawerOpened}
            onClick={toggleDrawer}
            hiddenFrom="md"
            size="sm"
            type="button"
            aria-label={drawerOpened ? "Fechar menu" : "Abrir menu"}
          />
          <Burger
            opened={desktopNavbarOpened}
            onClick={toggleDesktopNavbar}
            visibleFrom="md"
            size="sm"
            type="button"
            aria-label={desktopNavbarOpened ? "Fechar menu" : "Abrir menu"}
          />
          <Stack gap={0}>
            <Title order={3}>The Hybrid Architect</Title>
            <Text size="xs" c="dimmed">
              Prioridade com IA
            </Text>
          </Stack>
        </Group>
      </AppShell.Header>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        title="Navegação"
        padding="md"
        size="80%"
        position="left"
        hiddenFrom="md"
        withinPortal
        keepMounted
        zIndex={2000}
        withCloseButton
        closeOnClickOutside
        closeOnEscape
        trapFocus
        returnFocus
        overlayProps={{ backgroundOpacity: 0.55, blur: 2 }}
      >
        <Stack h="100%" justify="space-between" gap="xs">
          {mainNavLinks}

          <Stack gap="xs">
            <Divider my="xs" />
            {logoutNavLink}
            <Text size="xs" c="dimmed">
              MVP - Task Creator
            </Text>
          </Stack>
        </Stack>
      </Drawer>

      <AppShell.Navbar p="md" visibleFrom="md">
        <AppShell.Section mb="sm">
          <Text size="sm" fw={600}>
            Navegação
          </Text>
        </AppShell.Section>

        <AppShell.Section component={ScrollArea} grow>
          {mainNavLinks}
        </AppShell.Section>

        <AppShell.Section>
          <Stack gap="xs">
            <Divider />
            {logoutNavLink}
            <Text size="xs" c="dimmed">
              MVP - Task Creator
            </Text>
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg">{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
