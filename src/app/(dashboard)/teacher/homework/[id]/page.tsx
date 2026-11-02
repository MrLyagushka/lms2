// src/app/(dashboard)/teacher/homework/[id]/page.tsx
// Страница «Проверка ДЗ» учителя (ПРОМТ-14, часть B). Server Component:
// загружает ДЗ + все отправленные решения через getHomeworkForReviewAction
// (с проверкой, что ДЗ принадлежит текущему учителю) и рендерит клиентский
// компонент HomeworkReview (список учеников + модалка с ответами и оценками).

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireSessionOrRedirect } from '@/lib/auth';
import { getHomeworkForReviewAction } from '@/server/homework.actions';
import { HomeworkReview } from '@/components/teacher/homework-review';

export const metadata: Metadata = {
  title: 'Проверка ДЗ — LearnHub',
  description: 'Решения учеников, результаты автопроверки и выставление оценок',
};

interface PageProps {
  params: { id: string };
}

export default async function TeacherHomeworkReviewPage({ params }: PageProps) {
  await requireSessionOrRedirect('TEACHER', `/teacher/homework/${params.id}`);

  const result = await getHomeworkForReviewAction(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <HomeworkReview homework={result.data} />;
}
