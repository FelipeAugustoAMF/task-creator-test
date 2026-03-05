"use client";

import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { Notifications } from "@mantine/notifications";
import React from "react";
import "dayjs/locale/pt-br";

import { theme } from "@/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <DatesProvider settings={{ locale: "pt-br", weekendDays: [] }}>
        <Notifications position="top-right" />
        {children}
      </DatesProvider>
    </MantineProvider>
  );
}
