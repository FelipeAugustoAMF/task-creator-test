"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Checkbox,
  CopyButton,
  Divider,
  Grid,
  Group,
  Loader,
  Menu,
  Modal,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Tooltip,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconCheck,
  IconCircleCheck,
  IconCircleDashed,
  IconCopy,
  IconDeviceFloppy,
  IconDotsVertical,
  IconFileText,
  IconGauge,
  IconHash,
  IconHistory,
  IconListDetails,
  IconMessage,
  IconPencil,
  IconTags,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
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

function scoreColor(score: number) {
  if (score >= 8) return "red";
  if (score >= 5) return "yellow";
  return "green";
}

function formatConfidence(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${Math.round(value * 100)}%`;
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
    initialValues: { title: task.title, description: task.description, reassess: true },
    validate: {
      title: (v) => (v.trim().length === 0 ? "Título é obrigatório" : null),
      description: (v) => (v.trim().length === 0 ? "Descrição é obrigatória" : null),
    },
  });

  function openEdit() {
    editForm.setValues({ title: task.title, description: task.description, reassess: true });
    editForm.resetDirty();
    setEditOpen(true);
  }

  function submitEdit(values: { title: string; description: string; reassess: boolean }) {
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
      retryRuns();
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

  const completionBadge = (
    <Badge color={task.is_completed ? "green" : "yellow"} variant="light">
      {task.is_completed ? "concluída" : "pendente"}
    </Badge>
  );

  const statusBadge = (
    <Badge color={task.status === "done" ? "indigo" : "red"} variant="light">
      {statusLabelMap[task.status] || task.status}
    </Badge>
  );

  const scoreBadge =
    task.status === "done" && typeof task.score === "number" ? (
      <Badge color={scoreColor(task.score)} variant="light">
        score {task.score}
      </Badge>
    ) : null;

  const summaryFields = (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Stack gap={2}>
          <Text fw={600}>Resumo</Text>
          <Text size="xs" c="dimmed">
            Score
          </Text>
          <Group gap={6} align="baseline">
            <Text
              fw={800}
              size="xl"
              c={
                task.status === "done" && typeof task.score === "number"
                  ? scoreColor(task.score)
                  : "dimmed"
              }
            >
              {task.status === "done" && typeof task.score === "number" ? task.score : "—"}
            </Text>
            <Text size="xs" c="dimmed">
              /10
            </Text>
          </Group>
        </Stack>

        <ThemeIcon
          size={48}
          radius="md"
          variant="light"
          color={
            task.status === "done" && typeof task.score === "number"
              ? scoreColor(task.score)
              : "gray"
          }
        >
          <IconGauge size={24} />
        </ThemeIcon>
      </Group>

      <Group gap={6} wrap="wrap">
        {completionBadge}
        {statusBadge}
        {scoreBadge}
      </Group>

      <Divider />

      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Text size="sm" c="dimmed">
          Categoria
        </Text>
        {task.category ? (
          <Badge size="sm" color="gray" variant="light">
            {formatCategory(task.category)}
          </Badge>
        ) : (
          <Text size="sm" c="dimmed">
            —
          </Text>
        )}
      </Group>

      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          Confiança
        </Text>
        <Text size="sm" fw={600}>
          {formatConfidence(task.confidence)}
        </Text>
      </Group>
    </Stack>
  );

  const infoFields = (
    <Stack gap="sm">
      <Text fw={600}>Info</Text>

      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <ThemeIcon size={32} radius="md" variant="light" color="gray">
            <IconCalendarEvent size={18} />
          </ThemeIcon>
          <Stack gap={0} style={{ minWidth: 0 }}>
            <Text size="xs" c="dimmed">
              Criada em
            </Text>
            <Text size="sm" lineClamp={1}>
              {formatDate(task.created_at)}
            </Text>
          </Stack>
        </Group>
      </Group>

      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
          <ThemeIcon size={32} radius="md" variant="light" color="gray">
            <IconHash size={18} />
          </ThemeIcon>
          <Stack gap={0} style={{ minWidth: 0 }}>
            <Text size="xs" c="dimmed">
              Task ID
            </Text>
            <Text
              size="sm"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
              lineClamp={1}
            >
              {task.id}
            </Text>
          </Stack>
        </Group>

        <CopyButton value={task.id} timeout={1200}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? "Copiado" : "Copiar"} withArrow>
              <ActionIcon
                variant="subtle"
                color={copied ? "teal" : "gray"}
                onClick={copy}
                aria-label={copied ? "Copiado" : "Copiar Task ID"}
              >
                {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
    </Stack>
  );

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center" wrap="nowrap">
        <Button
          component={Link}
          href={returnTo}
          variant="subtle"
          size="sm"
          radius="xl"
          leftSection={<IconArrowLeft size={18} />}
        >
          Voltar
        </Button>

        <Group hiddenFrom="md">
          <Menu shadow="md" width={220} position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" aria-label="Ações">
                <IconDotsVertical size={20} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Ações</Menu.Label>
              <Menu.Item
                leftSection={
                  task.is_completed ? (
                    <IconCircleDashed size={16} />
                  ) : (
                    <IconCircleCheck size={16} />
                  )
                }
                onClick={toggleCompleted}
                disabled={isPending}
              >
                {task.is_completed ? "Marcar como pendente" : "Marcar como concluída"}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconPencil size={16} />}
                onClick={openEdit}
                disabled={isPending}
              >
                Editar
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={() => setDeleteOpen(true)}
                disabled={isPending}
              >
                Excluir
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            <Card withBorder radius="md">
              <Stack gap="xs">
                <Title order={2}>{task.title}</Title>

                <Group gap={6} wrap="wrap">
                  {completionBadge}
                  {statusBadge}
                  {scoreBadge}
                </Group>

                <Text c="dimmed" size="sm" style={{ whiteSpace: "pre-wrap" }} lineClamp={3}>
                  {task.description}
                </Text>
              </Stack>
            </Card>

            <Card withBorder radius="md" hiddenFrom="md">
              <Stack gap="md">
                {summaryFields}
                <Divider />
                {infoFields}
              </Stack>
            </Card>

            <Tabs value={tab} onChange={setTab} keepMounted={false} variant="outline">
              <Tabs.List>
                <Tabs.Tab value="details">
                  <Group gap={6}>
                    <IconListDetails size={16} />
                    <span>Detalhes</span>
                  </Group>
                </Tabs.Tab>
                <Tabs.Tab value="logs">
                  <Group gap={6}>
                    <IconHistory size={16} />
                    <span>Logs de prompt</span>
                  </Group>
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="details" pt="md">
                <Stack gap="md">
                  <Card withBorder radius="md">
                    <Stack gap="xs">
                      <Group gap="xs">
                        <ThemeIcon size={30} radius="md" variant="light" color="indigo">
                          <IconFileText size={16} />
                        </ThemeIcon>
                        <Text fw={600}>Descrição</Text>
                      </Group>
                      <Text style={{ whiteSpace: "pre-wrap" }}>{task.description}</Text>
                    </Stack>
                  </Card>

                  <Card withBorder radius="md">
                    <Stack gap="xs">
                      <Group gap="xs">
                        <ThemeIcon size={30} radius="md" variant="light" color="indigo">
                          <IconMessage size={16} />
                        </ThemeIcon>
                        <Text fw={600}>Justificativa</Text>
                      </Group>
                      {task.rationale ? (
                        <Text style={{ whiteSpace: "pre-wrap" }}>{task.rationale}</Text>
                      ) : (
                        <Text c="dimmed">—</Text>
                      )}
                    </Stack>
                  </Card>

                  <Card withBorder radius="md">
                    <Stack gap="xs">
                      <Group gap="xs">
                        <ThemeIcon size={30} radius="md" variant="light" color="indigo">
                          <IconTags size={16} />
                        </ThemeIcon>
                        <Text fw={600}>Tags</Text>
                      </Group>
                      <Group gap={6} wrap="wrap">
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
                    </Stack>
                  </Card>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="logs" pt="md">
                {runsLoading ? (
                  <Card withBorder radius="md">
                    <Group gap="xs">
                      <Loader size="sm" />
                      <Text c="dimmed" size="sm">
                        Carregando logs…
                      </Text>
                    </Group>
                  </Card>
                ) : runsError ? (
                  <Card withBorder radius="md">
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
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md" visibleFrom="md">
            <Card withBorder radius="md">
              {summaryFields}
            </Card>

            <Card withBorder radius="md">
              <Stack gap="sm">
                <Text fw={600}>Ações</Text>

                <Button
                  fullWidth
                  color={task.is_completed ? "gray" : "green"}
                  variant={task.is_completed ? "default" : "light"}
                  onClick={toggleCompleted}
                  loading={isPending}
                  leftSection={
                    task.is_completed ? <IconCircleDashed size={18} /> : <IconCircleCheck size={18} />
                  }
                >
                  {task.is_completed ? "Marcar como pendente" : "Marcar como concluída"}
                </Button>
                <Button
                  fullWidth
                  variant="default"
                  onClick={openEdit}
                  leftSection={<IconPencil size={18} />}
                  disabled={isPending}
                >
                  Editar
                </Button>
                <Button
                  fullWidth
                  color="red"
                  variant="light"
                  onClick={() => setDeleteOpen(true)}
                  leftSection={<IconTrash size={18} />}
                  disabled={isPending}
                >
                  Excluir
                </Button>
              </Stack>
            </Card>

            <Card withBorder radius="md">
              {infoFields}
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>

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
            <Checkbox
              label="Reavaliar tarefa"
              description="Roda o prompt novamente e atualiza score/categoria/tags."
              {...editForm.getInputProps("reassess", { type: "checkbox" })}
            />
            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => setEditOpen(false)}
                leftSection={<IconX size={18} />}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={isPending} leftSection={<IconDeviceFloppy size={18} />}>
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
            <Button
              variant="default"
              onClick={() => setDeleteOpen(false)}
              leftSection={<IconX size={18} />}
            >
              Cancelar
            </Button>
            <Button
              color="red"
              onClick={confirmDelete}
              loading={isPending}
              leftSection={<IconTrash size={18} />}
            >
              Excluir
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
