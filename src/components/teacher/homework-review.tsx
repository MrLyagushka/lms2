// src/components/teacher/homework-review.tsx
// Страница «Проверка ДЗ» учителя (ПРОМТ-14, часть B):
// - информация о ДЗ (заголовок, описание с LaTeX, дедлайн, количество задач);
// - список учеников, которые решили (статус + результат автопроверки);
// - клик по ученику → модалка ReviewSubmission с его ответами и формой оценки.

'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, CheckCircle2, Inbox, ListChecks, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MathRender } from '@/components/math/math-render';
import { ReviewSubmission } from '@/components/teacher/review-submission';
import type { SubmissionSummaryDTO, TeacherHomeworkReviewDTO } from '@/types';

function SubmissionRow({
  submission,
  onOpen,
}: {
  submission: SubmissionSummaryDTO;
  onOpen: (id: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(submission.id)}
        className={cn(
          'flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between',
        )}
        aria-label={`Открыть решение ученика ${submission.studentName}`}
      >
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            {submission.studentName}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {submission.submittedAt ? `Отправлено ${formatDate(submission.submittedAt)}` : 'Без даты отправки'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {submission.checkedCount > 0 ? (
            <Badge variant={submission.correctCount === submission.checkedCount ? 'success' : 'secondary'}>
              Автопроверка: {submission.correctCount}/{submission.checkedCount} верно
            </Badge>
          ) : (
            <Badge variant="secondary">Без автопроверки</Badge>
          )}
          {submission.status === 'CHECKED' ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Проверено · {submission.grade ?? '—'}
            </Badge>
          ) : (
            <Badge variant="warning">Ждёт проверки</Badge>
          )}
        </div>
      </button>
    </li>
  );
}

export function HomeworkReview({ homework }: { homework: TeacherHomeworkReviewDTO }) {
  const [openSubmissionId, setOpenSubmissionId] = useState<string | null>(null);

  const closeReview = useCallback(() => setOpenSubmissionId(null), []);

  const pendingCount = homework.submissions.filter((s) => s.status === 'SUBMITTED').length;

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="space-y-2">
        <Link
          href="/teacher/homework"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          К списку ДЗ
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{homework.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <ListChecks className="h-4 w-4" />
            {homework.totalTasks} задач
          </span>
          {homework.deadline && (
            <span className="flex items-center gap-1">
              <CalendarClock className="h-4 w-4" />
              Дедлайн: {formatDate(homework.deadline)}
            </span>
          )}
          <span>Решений отправлено: {homework.submissions.length}</span>
          {pendingCount > 0 && <Badge variant="warning">Ждут проверки: {pendingCount}</Badge>}
        </div>
        {homework.description && (
          <MathRender content={homework.description} className="text-sm text-muted-foreground" />
        )}
      </div>

      {/* Список решений */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ученики, которые решили ДЗ</CardTitle>
        </CardHeader>
        <CardContent>
          {homework.submissions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Пока никто не отправил решение этого ДЗ. Отправленные работы появятся здесь.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {homework.submissions.map((s) => (
                <SubmissionRow key={s.id} submission={s} onOpen={setOpenSubmissionId} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Задачи ДЗ (для контекста при проверке) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Задачи ДЗ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {homework.tasks.map((task) => (
            <div key={task.id} className="rounded-lg border border-border p-3">
              <p className="mb-1 text-sm font-medium text-foreground">Задача {task.order}</p>
              <MathRender content={task.content} className="text-sm text-muted-foreground" />
              {task.correctAnswer !== null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Эталон: <span className="font-mono">{task.correctAnswer}</span>
                </p>
              )}
              {task.requirePhoto && (
                <p className="mt-1 text-xs text-muted-foreground">Требуется фото-ответ</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Модалка проверки конкретного решения */}
      {openSubmissionId && (
        <ReviewSubmission submissionId={openSubmissionId} onClose={closeReview} />
      )}
    </div>
  );
}
