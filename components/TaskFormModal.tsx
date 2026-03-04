"use client";

import { Button, Modal, Stack, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import React, { useTransition } from "react";

import { createTaskAction } from "@/app/dashboard/actions";

export function TaskFormModal(props: {
  opened: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    initialValues: {
      title: "",
      description: "",
    },
    validate: {
      title: (v) => (v.trim().length === 0 ? "Title is required" : null),
      description: (v) => (v.trim().length === 0 ? "Description is required" : null),
    },
  });

  function onSubmit(values: { title: string; description: string }) {
    startTransition(async () => {
      const result = await createTaskAction(values);
      if (!result.ok) {
        notifications.show({
          color: "red",
          title: "Failed to create task",
          message: result.taskId ? `${result.message} (taskId: ${result.taskId})` : result.message,
        });
        return;
      }

      notifications.show({
        color: "green",
        title: "Task created",
        message: `Score: ${result.task.score ?? "-"} • Category: ${result.task.category ?? "-"}`,
      });

      form.reset();
      props.onCreated();
    });
  }

  return (
    <Modal opened={props.opened} onClose={props.onClose} title="New Task" centered>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack>
          <TextInput label="Title" placeholder="Short summary" {...form.getInputProps("title")} />
          <Textarea
            label="Description"
            placeholder="Context, steps, impact, deadlines…"
            autosize
            minRows={5}
            {...form.getInputProps("description")}
          />
          <Button type="submit" loading={isPending}>
            Create & Score
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}

