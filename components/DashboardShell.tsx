"use client";

import { AppShell, Group, NavLink, Title } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: "sm" }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Title order={3}>The Hybrid Architect</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={Link}
          href="/dashboard"
          label="Tarefas"
          active={pathname === "/dashboard"}
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
