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
import React, { useState } from "react";

export function LoginPageClient(props: { errorMessage?: string | null }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const validation = form.validate();
    if (validation.hasErrors) {
      event.preventDefault();
      return;
    }

    setIsSubmitting(true);
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

        {props.errorMessage ? (
          <Alert color="red" variant="light" title="Falha ao entrar">
            <Text size="sm">{props.errorMessage}</Text>
          </Alert>
        ) : null}

        <Alert variant="light" title="Usuário padrão">
          <Text size="sm">
            Usuário: <b>admin</b>
            <br />
            Senha: <b>admin</b>
          </Text>
        </Alert>

        <Card withBorder shadow="sm" p="lg" radius="md">
          <form method="post" action="/api/login" onSubmit={onSubmit}>
            <Stack>
              <TextInput
                label="Usuário"
                placeholder="admin"
                autoComplete="username"
                {...form.getInputProps("username")}
                name="username"
                required
              />
              <PasswordInput
                label="Senha"
                placeholder="admin"
                autoComplete="current-password"
                {...form.getInputProps("password")}
                name="password"
                required
              />
              <Button type="submit" loading={isSubmitting}>
                Entrar
              </Button>
            </Stack>
          </form>
        </Card>
      </Stack>
    </Container>
  );
}
