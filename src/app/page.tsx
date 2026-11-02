// src/app/page.tsx
// Корневая страница: лендинг. Авторизованных сразу редиректим в их дашборд.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, CheckSquare, Users } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';

export default async function HomePage() {
  const session = await getSessionUser();
  if (session) {
    redirect(session.role === 'TEACHER' ? '/teacher/homework' : '/student/homework');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      <div className="flex items-center gap-2 text-primary">
        <BookOpen className="h-8 w-8" aria-hidden />
        <span className="text-2xl font-bold">Learning Platform</span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Домашние задания с математикой — просто и удобно
      </h1>
      <p className="max-w-xl text-muted-foreground">
        Учитель создаёт ДЗ с формулами LaTeX, ученик решает их с автосохранением,
        система автоматически проверяет ответы, а учитель выставляет оценки.
      </p>

      <div className="grid w-full gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <CheckSquare className="mx-auto mb-2 h-6 w-6 text-primary" aria-hidden />
          <p className="text-sm font-medium">Автопроверка ответов</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Users className="mx-auto mb-2 h-6 w-6 text-primary" aria-hidden />
          <p className="text-sm font-medium">Привязка по коду учителя</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <BookOpen className="mx-auto mb-2 h-6 w-6 text-primary" aria-hidden />
          <p className="text-sm font-medium">Формулы LaTeX в задачах</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Войти
        </Link>
        <Link
          href="/register"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 font-medium transition-colors hover:bg-muted"
        >
          Зарегистрироваться
        </Link>
      </div>
    </main>
  );
}
