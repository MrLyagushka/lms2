// src/app/(dashboard)/teacher/homework/page.tsx
// Список ДЗ учителя. Server Component: загрузка данных из Prisma напрямую,
// рендер через клиентский HomeworkList (нужны кнопки/подтверждения).

import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getServerUserOrThrow } from '@/lib/auth';
import { db } from '@/lib/db';
import { HomeworkList } from '@/components/homework/homework-list';

export const metadata: Metadata = {
  title: 'Мои ДЗ — LearnHub',
  description: 'Список домашних заданий учителя',
};

export default async function TeacherHomeworksPage() {
  const user = await getServerUserOrThrow();

  const profile = await db.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  const homeworks = profile
    ? await db.homework.findMany({
        where: { teacherId: profile.id },
        include: { _count: { select: { tasks: true, submissions: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const items = homeworks.map((hw) => ({
    id: hw.id,
    title: hw.title,
    description: hw.description,
    deadline: hw.deadline ? hw.deadline.toISOString() : null,
    createdAt: hw.createdAt.toISOString(),
    tasksCount: hw._count.tasks,
    submissionsCount: hw._count.submissions,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Мои домашние задания</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Всего ДЗ: {items.length}
          </p>
        </div>
        <Link
          href="/teacher/homework/new"
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Создать новое ДЗ
        </Link>
      </div>

      <HomeworkList homeworks={items} />
    </div>
  );
}
