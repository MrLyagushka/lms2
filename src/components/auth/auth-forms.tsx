// src/components/auth/auth-forms.tsx
// Клиентские формы входа и регистрации. Кнопки disabled во время отправки.

'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginAction, registerAction } from '@/server/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

function ErrorBanner({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </p>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await loginAction({
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(result.data?.redirectTo ?? '/');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} />}
      <label className="flex flex-col gap-1 text-sm font-medium">
        E-mail
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="student@example.com"
          disabled={pending}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Пароль
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          disabled={pending}
        />
      </label>
      <Button type="submit" disabled={pending}>
        {pending && <Spinner className="h-4 w-4" />}
        Войти
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Нет аккаунта?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await registerAction({
      fullName: String(form.get('fullName') ?? ''),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      role: String(form.get('role') ?? ''),
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(result.data?.redirectTo ?? '/');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} />}
      <label className="flex flex-col gap-1 text-sm font-medium">
        ФИО
        <Input name="fullName" required placeholder="Иванова Мария Петровна" disabled={pending} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        E-mail
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          disabled={pending}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Пароль (минимум 6 символов)
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="••••••••"
          disabled={pending}
        />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Кто вы?</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="role" value="STUDENT" defaultChecked disabled={pending} />
            Ученик
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="role" value="TEACHER" disabled={pending} />
            Учитель
          </label>
        </div>
      </fieldset>
      <Button type="submit" disabled={pending}>
        {pending && <Spinner className="h-4 w-4" />}
        Создать аккаунт
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Войти
        </Link>
      </p>
    </form>
  );
}
