// src/app/(dashboard)/student/homework/page.tsx
// Вкладка «Домашние задания» ученика. Server Component: получает список ДЗ
// своего учителя через getStudentHomeworksAction и рендерит карточки.

import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { getServerUserOrThrow } from '@/lib/auth';
import { db } from '@/lib/db';
import { getStudentHomeworksAction } from '@/server/homework.actions';
import { StudentHomeworkList } from '@/components/homework/student-homework-list';
import type { StudentHomeworkItemDTO } from '@/types';

export const metadata: Metadata = {
  title: 'Домашние задания — LearnHub',
  description: 'Список домашних заданий вашего учителя',
};

export default async function StudentHomeworksPage() {
  const user = await getServerUserOrThrow();

  // Профиль ученика — нужен, чтобы понять, привязан ли учитель (для баннера)
  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: user.id },
    select: { teacherId: true },
  });

  // Список ДЗ + статусы решения — через Server Action (гарантия роли и профиля)
  const result = await getStudentHomeworksAction();

  const homeworks: StudentHomeworkItemDTO[] =
    result.success && result.data ? result.data.homeworks : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Домашние задания</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Задания от вашего учителя: {homeworks.length}
        </p>
      </div>

      {/* Баннер: учитель не привязан */}
      {!studentProfile?.teacherId && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-foreground">Учитель не привязан</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Чтобы получать домашние задания, введите уникальный код вашего учителя.{' '}
              <Link
                href="/student/link-teacher"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Привязаться сейчас →
              </Link>
            </p>
          </div>
        </div>
      )}

      <StudentHomeworkList homeworks={homeworks} />
    </div>
  );
}
