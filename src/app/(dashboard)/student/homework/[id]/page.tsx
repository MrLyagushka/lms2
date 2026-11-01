// src/app/(dashboard)/student/homework/[id]/page.tsx
// Страница решения ДЗ учеником (ПРОМТ-13). Server Component: получает ДЗ +
// задачи + текущую Submission через getHomeworkForStudentAction (с проверкой,
// что ДЗ принадлежит учителю ученика) и рендерит клиентский компонент решения.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { getServerUserOrThrow } from '@/lib/auth';
import { getHomeworkForStudentAction } from '@/server/homework.actions';
import { SolveHomework } from '@/components/homework/solve-homework';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Решение домашнего задания — LearnHub',
  description: 'Решите домашнее задание — ответы сохраняются автоматически',
};

interface PageProps {
  params: { id: string };
}

export default async function StudentSolveHomeworkPage({ params }: PageProps) {
  await getServerUserOrThrow(); // требует авторизации (роль проверяется в action)

  const result = await getHomeworkForStudentAction(params.id);

  if (!result.success || !result.data) {
    // Недоступное/несуществующее ДЗ или учитель не привязан
    if (result.error && /учитель/i.test(result.error)) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
            <p className="font-medium text-foreground">Учитель не привязан</p>
            <p className="text-sm text-muted-foreground">
              Домашние задания выдаёт ваш учитель. Сначала привяжитесь к нему.
            </p>
            <Link
              href="/student/link-teacher"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Привязать учителя →
            </Link>
          </CardContent>
        </Card>
      );
    }
    notFound();
  }

  return (
    <div className="space-y-4">
      <Link
        href="/student/homework"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Все домашние задания
      </Link>
      <SolveHomework homework={result.data} />
    </div>
  );
}
