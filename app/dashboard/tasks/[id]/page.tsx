import { notFound } from "next/navigation";
import React from "react";

import { TaskDetailClient } from "@/components/TaskDetailClient";
import { getTaskById } from "@/lib/tasks/service";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage(props: { params: { id: string } }) {
  const task = await getTaskById(props.params.id);
  if (!task) notFound();

  return <TaskDetailClient task={task} />;
}
