"use client";

import { Button, Modal, Select, Stack, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import React, { useTransition } from "react";

import { createTaskAction } from "@/app/dashboard/actions";
import { OPENAI_LIGHT_MODEL_OPTIONS, OPENAI_LIGHT_MODEL_VALUES } from "@/lib/openai/models";

type TaskFormValues = {
  title: string;
  description: string;
  model: string;
};

export function TaskFormModal(props: {
  opened: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<TaskFormValues>({
    initialValues: {
      title: "",
      description: "",
      model: OPENAI_LIGHT_MODEL_VALUES[0],
    },
    validate: {
      title: (v) => (v.trim().length === 0 ? "Título é obrigatório" : null),
      description: (v) => (v.trim().length === 0 ? "Descrição é obrigatória" : null),
    },
  });

  function onSubmit(values: TaskFormValues) {
    startTransition(async () => {
      const result = await createTaskAction(values);
      if (!result.ok) {
        notifications.show({
          color: "red",
          title: "Falha ao criar tarefa",
          message: result.taskId
            ? `${result.message} (taskId: ${result.taskId})`
            : result.message,
        });
        return;
      }

      notifications.show({
        color: "green",
        title: "Tarefa criada",
        message: `Score: ${result.task.score ?? "-"} • Categoria: ${result.task.category ?? "-"}`,
      });

      form.reset();
      props.onCreated();
    });
  }

  return (
    <Modal opened={props.opened} onClose={props.onClose} title="Nova tarefa" centered>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack>
          <TextInput label="Título" placeholder="Resumo curto" {...form.getInputProps("title")} />
          <Textarea
            label="Descrição"
            placeholder="Contexto, passos, impacto, prazos…"
            autosize
            minRows={5}
            {...form.getInputProps("description")}
          />
          <Select
            label="Modelo (OpenAI)"
            description="Usado para pontuar esta tarefa"
            data={OPENAI_LIGHT_MODEL_OPTIONS}
            value={form.values.model}
            onChange={(value) =>
              form.setFieldValue("model", value || OPENAI_LIGHT_MODEL_VALUES[0])
            }
            allowDeselect={false}
            searchable
            nothingFoundMessage="Nenhum modelo encontrado"
          />
          <Button type="submit" loading={isPending}>
            Criar e pontuar
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
