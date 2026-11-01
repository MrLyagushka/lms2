// src/components/homework/homework-list.tsx
// Клиентский список ДЗ учителя: карточки + удаление (с подтверждением).

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, ListChecks, Users, Trash2, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteHomeworkAction } from '@/server/homework.actions';
import type { HomeworkItemDTO } from '@/types';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function HomeworkList({ homeworks }: { homeworks: HomeworkItemDTO[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string): Promise<void> => {
    if (!window.confirm(`Удалить ДЗ «${title}»? Действие необратимо.`)) return;
    setPendingId(id);
    setError(null);
    const result = await deleteHomeworkAction(id);
    setPendingId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Пустое состояние */}
      {homeworks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">У вас пока нет домашнего задания</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Создайте первое ДЗ — ученики увидят его в своём кабинете.
              </p>
            </div>
            <Link
              href="/teacher/homework/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Создать новое ДЗ
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Карточки ДЗ */}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {homeworks.map((hw) => (
          <li key={hw.id}>
            <Card className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2 text-base">{hw.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 text-sm text-muted-foreground">
                {hw.description && (
                  <p className="line-clamp-2">{hw.description}</p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <ListChecks className="h-4 w-4" />
                    Задач: {hw.tasksCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Решают: {hw.submissionsCount}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    Создано: {formatDate(hw.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Дедлайн: {formatDate(hw.deadline)}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-2">
                  <Link
                    href={`/teacher/homework/${hw.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Подробнее
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    disabled={pendingId === hw.id || hw.submissionsCount > 0}
                    onClick={() => handleDelete(hw.id, hw.title)}
                    aria-label={`Удалить ДЗ ${hw.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    {pendingId === hw.id ? 'Удаление…' : 'Удалить'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
