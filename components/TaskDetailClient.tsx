"use client";

import {
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useTransition } from "react";

import { PromptRunViewer } from "@/components/PromptRunViewer";
import {
  deleteTaskAction,
  setTaskCompletedAction,
  updateTaskAction,
} from "@/app/dashboard/actions";
import { ALLOWED_TAG_LABELS, SCORING_CATEGORY_LABELS } from "@/lib/scoring/taxonomy";
import { ScoringRunRow, TaskRow } from "@/lib/tasks/types";

const legacyCategoryMap: Record<string, string> = {
  incident: "incidente",
  bug: "defeito",
  feature: "melhoria",
  ops: "manutenção",
  finance: "financeiro",
  support: "suporte",
  other: "outro",
  manutencao: "manutenção",
  seguranca: "segurança",
};

const statusLabelMap: Record<string, string> = {
  done: "pontuada",
  failed: "falhou",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

function formatCategory(value: string) {
  const key = value.trim().toLowerCase();
  const canonical = legacyCategoryMap[key] ?? key;
  return (SCORING_CATEGORY_LABELS as Record<string, string>)[canonical] || value;
}

function formatTag(value: string) {
  return (ALLOWED_TAG_LABELS as Record<string, string>)[value] || value;
}

export function TaskDetailClient(props: { task: TaskRow }) {
  const { task } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToRaw = searchParams.get("returnTo");
  const returnTo = returnToRaw && returnToRaw.startsWith("/dashboard") ? returnToRaw : "/dashboard";
  const [tab, setTab] = useState<string | null>("details");
  const [runs, setRuns] = useState<ScoringRunRow[] | null>(null);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const editForm = useForm({
    initialValues: { title: task.title, description: task.description },
    validate: {
      title: (v) => (v.trim().length === 0 ? "Título é obrigatório" : null),
      description: (v) => (v.trim().length === 0 ? "Descrição é obrigatória" : null),
    },
  });

  function openEdit() {
    editForm.setValues({ title: task.title, description: task.description });
    editForm.resetDirty();
    setEditOpen(true);
  }

  function submitEdit(values: { title: string; description: string }) {
    startTransition(async () => {
      const result = await updateTaskAction({ id: task.id, ...values });
      if (!result.ok) {
        notifications.show({
          color: "red",
          title: "Falha ao atualizar tarefa",
          message: result.message,
        });
        return;
      }

      notifications.show({ color: "green", title: "Tarefa atualizada", message: "Salvo." });
      setEditOpen(false);
      router.refresh();
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteTaskAction({ id: task.id });
      if (!result.ok) {
        notifications.show({
          color: "red",
          title: "Falha ao excluir tarefa",
          message: result.message,
        });
        return;
      }

      notifications.show({ color: "green", title: "Tarefa excluída", message: "Removida." });
      setDeleteOpen(false);
      router.push(returnTo);
    });
  }

  function toggleCompleted() {
    startTransition(async () => {
      const nextCompleted = !task.is_completed;
      const result = await setTaskCompletedAction({ id: task.id, isCompleted: nextCompleted });
      if (!result.ok) {
        notifications.show({
          color: "red",
          title: "Falha ao atualizar status",
          message: result.message,
        });
        return;
      }

      notifications.show({
        color: "green",
        title: nextCompleted ? "Tarefa concluída" : "Tarefa pendente",
        message: nextCompleted ? "Marcada como concluída." : "Marcada como pendente.",
      });
      router.refresh();
    });
  }

  function retryRuns() {
    setRuns(null);
    setRunsError(null);
    setRunsLoading(false);
  }

  useEffect(() => {
    setTab("details");
    setRuns(null);
    setRunsError(null);
    setRunsLoading(false);
    setEditOpen(false);
    setDeleteOpen(false);
  }, [task.id]);

  useEffect(() => {
    if (tab !== "logs") return;
    if (runs != null || runsLoading || runsError) return;

    setRunsLoading(true);
    setRunsError(null);

    fetch(`/api/dashboard/tasks/${task.id}/runs`, { cache: "no-store" })
      .then(async (res) => {
        if (res.ok) return res.json();
        const body = await res.json().catch(() => null);
        const message =
          body && typeof body === "object" && typeof body.message === "string"
            ? body.message
            : `Falha ao carregar logs (${res.status})`;
        throw new Error(message);
      })
      .then((body) => {
        const nextRuns = body && typeof body === "object" ? (body as any).runs : null;
        setRuns(Array.isArray(nextRuns) ? nextRuns : []);
      })
      .catch((error) => {
        setRunsError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        setRunsLoading(false);
      });
  }, [runs, runsLoading, runsError, tab, task.id]);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={2}>
          <Button
            component={Link}
            href={returnTo}
            variant="default"
            size="xs"
            radius="xl"
            leftSection="←"
          >
            Voltar para tarefas
          </Button>
          <Title order={2}>{task.title}</Title>
          <Text c="dimmed" size="sm">
            {formatDate(task.created_at)}
          </Text>
          <Text c="dimmed" size="sm" lineClamp={2}>
            {task.description}
          </Text>
        </Stack>

        <Stack gap="xs" align="flex-end">
          <Group gap="xs">
            <Button
              size="xs"
              color={task.is_completed ? "gray" : "green"}
              variant={task.is_completed ? "default" : "light"}
              onClick={toggleCompleted}
              loading={isPending}
            >
              {task.is_completed ? "Marcar como pendente" : "Marcar como concluída"}
            </Button>
            <Button size="xs" variant="default" onClick={openEdit}>
              Editar
            </Button>
            <Button size="xs" color="red" variant="light" onClick={() => setDeleteOpen(true)}>
              Excluir
            </Button>
          </Group>

          <Group gap="xs">
            <Badge color={task.is_completed ? "green" : "yellow"} variant="light">
              {task.is_completed ? "concluída" : "pendente"}
            </Badge>
            <Badge color={task.status === "done" ? "indigo" : "red"} variant="light">
              {statusLabelMap[task.status] || task.status}
            </Badge>
            {task.status === "done" && (
              <Badge color="gray" variant="light">
                score {task.score}
              </Badge>
            )}
          </Group>
        </Stack>
      </Group>

      <Tabs value={tab} onChange={setTab} keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="details">Detalhes</Tabs.Tab>
          <Tabs.Tab value="logs">Logs de prompt</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details" pt="md">
          <Card withBorder>
            <Stack gap="sm">
              <Group gap="xs">
                <Text fw={600}>Categoria:</Text>
                <Text>{task.category ? formatCategory(task.category) : "—"}</Text>
              </Group>
              <Group gap="xs">
                <Text fw={600}>Confiança:</Text>
                <Text>
                  {typeof task.confidence === "number" ? task.confidence.toFixed(2) : "—"}
                </Text>
              </Group>
              <Group gap="xs" align="flex-start">
                <Text fw={600}>Tags:</Text>
                <Group gap={6}>
                  {task.tags?.length ? (
                    task.tags.map((t) => (
                      <Badge key={t} size="sm" variant="outline">
                        {formatTag(t)}
                      </Badge>
                    ))
                  ) : (
                    <Text c="dimmed">—</Text>
                  )}
                </Group>
              </Group>
              <Group gap="xs" align="flex-start">
                <Text fw={600}>Justificativa:</Text>
                <Text style={{ flex: 1 }}>{task.rationale || "—"}</Text>
              </Group>
              <Stack gap={4}>
                <Text fw={600}>Descrição</Text>
                <Text style={{ whiteSpace: "pre-wrap" }}>{task.description}</Text>
              </Stack>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="logs" pt="md">
          {runsLoading ? (
            <Card withBorder>
              <Group gap="xs">
                <Loader size="sm" />
                <Text c="dimmed" size="sm">
                  Carregando logs…
                </Text>
              </Group>
            </Card>
          ) : runsError ? (
            <Card withBorder>
              <Stack gap="xs">
                <Text c="red" size="sm">
                  {runsError}
                </Text>
                <Group justify="flex-end">
                  <Button size="xs" variant="default" onClick={retryRuns}>
                    Tentar novamente
                  </Button>
                </Group>
              </Stack>
            </Card>
          ) : runs ? (
            <PromptRunViewer runs={runs} />
          ) : null}
        </Tabs.Panel>
      </Tabs>

      <Modal opened={editOpen} onClose={() => setEditOpen(false)} title="Editar tarefa" centered>
        <form onSubmit={editForm.onSubmit(submitEdit)}>
          <Stack>
            <TextInput label="Título" {...editForm.getInputProps("title")} />
            <Textarea
              label="Descrição"
              autosize
              minRows={6}
              {...editForm.getInputProps("description")}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={isPending}>
                Salvar
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Excluir tarefa"
        centered
      >
        <Stack>
          <Text>
            Tem certeza que deseja excluir esta tarefa? Essa ação não pode ser desfeita.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button color="red" onClick={confirmDelete} loading={isPending}>
              Excluir
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
