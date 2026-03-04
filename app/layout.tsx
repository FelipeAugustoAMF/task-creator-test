import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import React from "react";

import { Providers } from "@/app/providers";

export const metadata = {
  title: "The Hybrid Architect",
  description: "AI-Priority Middleware MVP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

