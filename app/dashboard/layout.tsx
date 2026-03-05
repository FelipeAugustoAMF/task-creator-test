import React from "react";

import { DashboardShell } from "@/components/DashboardShell";
import { requireSessionUserId } from "@/lib/auth/requireSession";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  requireSessionUserId();
  return <DashboardShell>{children}</DashboardShell>;
}
