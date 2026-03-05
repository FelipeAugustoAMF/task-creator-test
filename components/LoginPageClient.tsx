"use client";

import {
  Alert,
  Button,
  Card,
  Container,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import React, { useTransition } from "react";

import { loginAction } from "@/app/login/actions";

export function LoginPageClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    validate: {
      username: (v) => (v.trim().length === 0 ? "Usuário é obrigatório" : null),
      password: (v) => (v.trim().length === 0 ? "Senha é obrigatória" : null),
    },
  });

  function onSubmit(values: { username: string; password: string }) {
    startTransition(async () => {
      let result: Awaited<ReturnType<typeof loginAction>> | null = null;
      try {
        result = await loginAction(values);
      } catch {
        notifications.show({
          color: "red",
          title: "Falha ao entrar",
          message: "Não foi possível logar. Tente novamente.",
        });
        return;
      }

      if (!result.ok) {
        notifications.show({
          color: "red",
          title: "Falha ao entrar",
          message: result.message,
        });
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <Container size={420} my={80}>
      <Stack gap="xs">
        <Title order={2} ta="center">
          Entrar
        </Title>
        <Text c="dimmed" size="sm" ta="center">
          Use o usuário padrão abaixo para testar.
        </Text>

        <Alert variant="light" title="Usuário padrão">
          <Text size="sm">
            Usuário: <b>admin</b>
            <br />
            Senha: <b>admin</b>
          </Text>
        </Alert>

        <Card withBorder shadow="sm" p="lg" radius="md">
          <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
              <TextInput
                label="Usuário"
                placeholder="admin"
                autoComplete="username"
                {...form.getInputProps("username")}
              />
              <PasswordInput
                label="Senha"
                placeholder="admin"
                autoComplete="current-password"
                {...form.getInputProps("password")}
              />
              <Button type="submit" loading={isPending}>
                Entrar
              </Button>
            </Stack>
          </form>
        </Card>
      </Stack>
    </Container>
  );
}
