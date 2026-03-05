"use client";

import {
  ActionIcon,
  AppShell,
  Burger,
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
import { useDisclosure, useLocalStorage, useMediaQuery } from "@mantine/hooks";
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
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure();
  const [desktopOpened, setDesktopOpened] = useLocalStorage({
    key: "tha_nav_desktop_open",
    defaultValue: true,
  });
  const isMobile = useMediaQuery("(max-width: 991px)");

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
    closeMobile();
  }, [closeMobile, pathname]);

  const burgerOpened = isMobile ? mobileOpened : desktopOpened;

  const navLinks = (
    <>
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
        onClick={closeMobile}
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
        onClick={closeMobile}
      />
    </>
  );

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 260,
        breakpoint: "md",
        // Mantine AppShell navbar sometimes fails to slide-in on mobile depending on layout;
        // use Drawer for mobile and keep AppShell.Navbar for desktop.
        collapsed: { mobile: true, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={burgerOpened}
              onClick={(e) => {
                e.stopPropagation();
                if (isMobile) {
                  toggleMobile();
                } else {
                  setDesktopOpened((v) => !v);
                }
              }}
              size="sm"
              type="button"
              aria-label={burgerOpened ? "Fechar menu" : "Abrir menu"}
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

      <Drawer
        opened={mobileOpened}
        onClose={closeMobile}
        title="Navegação"
        padding="md"
        size={260}
        hiddenFrom="md"
        withinPortal
        keepMounted={false}
        zIndex={1000}
        overlayProps={{ backgroundOpacity: 0.55, blur: 2 }}
      >
        <Stack gap="xs">
          {navLinks}
          <Text size="xs" c="dimmed" mt="md">
            MVP - Task Creator
          </Text>
        </Stack>
      </Drawer>

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
              visibleFrom="md"
            >
              {desktopOpened ? "«" : "»"}
            </ActionIcon>
          </Group>
        </AppShell.Section>

        <AppShell.Section component={ScrollArea} grow>
          {navLinks}
        </AppShell.Section>

        <AppShell.Section>
          <Text size="xs" c="dimmed">
            MVP - Task Creator
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg">{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
