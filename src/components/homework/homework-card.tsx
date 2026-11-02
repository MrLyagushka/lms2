// src/components/homework/homework-card.tsx
// Клиентская карточка ДЗ для ученика: название, учитель, дедлайн (с подсветкой),
// количество задач, статус-бейдж и кнопка «Открыть» → /student/homework/[id].

'use client';

import Link from 'next/link';
import { CalendarClock, ListChecks, User, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StudentHomeworkItemDTO, StudentHomeworkStatus } from '@/types';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

type DeadlineTone = 'none' | 'urgent' | 'overdue' | 'normal';

interface DeadlineInfo {
  label: string;
  tone: DeadlineTone;
}

/** Вычисляет текст дедлайна и его «тон»: просрочен / менее 24 часов / обычный. */
function getDeadlineInfo(iso: string | null, now: number): DeadlineInfo {
  if (!iso) return { label: 'Без дедлайна', tone: 'none' };

  const deadline = new Date(iso);
  const diff = deadline.getTime() - now;

  const formatted = deadline.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  if (diff < 0) return { label: `Просрочено: ${formatted}`, tone: 'overdue' };
  if (diff < DAY_MS) {
    const hoursLeft = Math.max(1, Math.round(diff / HOUR_MS));
    return { label: `Осталось ~${hoursLeft} ч: ${formatted}`, tone: 'urgent' };
  }
  return { label: `До ${formatted}`, tone: 'normal' };
}

const statusConfig: Record<
  StudentHomeworkStatus,
  { label: string; variant: 'secondary' | 'warning' | 'default' | 'success' }
> = {
  NONE: { label: 'Не начато', variant: 'secondary' },
  DRAFT: { label: 'Черновик', variant: 'warning' },
  SUBMITTED: { label: 'Отправлено', variant: 'default' },
  CHECKED: { label: 'Проверено', variant: 'success' },
};

const deadlineTextClasses: Record<DeadlineTone, string> = {
  none: 'text-muted-foreground',
  normal: 'text-muted-foreground',
  urgent: 'font-semibold text-red-600 dark:text-red-400',
  overdue: 'font-semibold text-red-600 dark:text-red-400',
};

export function HomeworkCard({ homework }: { homework: StudentHomeworkItemDTO }) {
  const deadline = getDeadlineInfo(homework.deadline, Date.now());
  const status = statusConfig[homework.status];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base">{homework.title}</CardTitle>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          {homework.teacherName}
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 text-sm text-muted-foreground">
        {homework.description && (
          <p className="line-clamp-2">{homework.description}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <ListChecks className="h-4 w-4" />
            Задач: {homework.tasksCount}
          </span>
          <span className={cn('inline-flex items-center gap-1', deadlineTextClasses[deadline.tone])}>
            <CalendarClock className="h-4 w-4" />
            {deadline.label}
          </span>
        </div>

        {homework.status === 'CHECKED' && homework.grade && (
          <p className="text-sm">
            Оценка: <span className="font-semibold text-foreground">{homework.grade}</span>
          </p>
        )}

        <div className="mt-auto pt-2">
          <Link
            href={`/student/homework/${homework.id}`}
            className={cn(
              'inline-flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors sm:w-auto sm:px-4',
              'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            aria-label={`Открыть ДЗ «${homework.title}»`}
          >
            Открыть
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
