// src/app/(dashboard)/teacher/homework/new/page.tsx
// Страница создания ДЗ. Server Component — только заголовок + клиентская форма.

import type { Metadata } from 'next';
import { HomeworkForm } from '@/components/homework/homework-form';

export const metadata: Metadata = {
  title: 'Создать ДЗ — LearnHub',
  description: 'Форма создания домашнего задания с задачами',
};

export default function NewHomeworkPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Новое домашнее задание</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Заполните параметры ДЗ и добавьте задачи. Формулы в тексте задач можно писать на LaTeX
          (например, $x^2 - 5x + 6 = 0$).
        </p>
      </div>
      <HomeworkForm />
    </div>
  );
}
