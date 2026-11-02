// src/components/teacher/review-submission.tsx
// Модалка проверки решения ученика (ПРОМТ-14, часть B):
// - подгружает полное решение через getSubmissionReviewAction по клику учителя;
// - показывает все ответы: условие (MathRender), ответ ученика, фото, результат автопроверки;
// - форма оценки: grade + комментарий → gradeSubmissionAction (SUBMITTED -> CHECKED);
// - кнопка disabled во время отправки, обработка ошибок сети с повтором.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, Save, SendHorizontal, User, X, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MathRender } from '@/components/math/math-render';
import {
  getSubmissionReviewAction,
  gradeSubmissionAction,
} from '@/server/homework.actions';
import type { SubmissionReviewDTO } from '@/types';

interface ReviewSubmissionProps {
  submissionId: string;
  onClose: () => void;
}

export function ReviewSubmission({ submissionId, onClose }: ReviewSubmissionProps) {
  const router = useRouter();
  const [data, setData] = useState<SubmissionReviewDTO | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [grade, setGrade] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Загрузка полного решения + закрытие по Escape + блокировка скролла фона
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getSubmissionReviewAction(submissionId);
      if (cancelled) return;
      if (result.success && result.data) {
        setData(result.data);
        setGrade(result.data.grade ?? '');
        setComment(result.data.comment ?? '');
      } else {
        setLoadError(result.error ?? 'Не удалось загрузить решение');
      }
    })();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      cancelled = true;
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [submissionId, onClose]);

  const handleGrade = useCallback(async () => {
    if (!grade.trim()) return;
    setSaving(true);
    setSaveError(null);
    const result = await gradeSubmissionAction(submissionId, {
      grade: grade.trim(),
      comment: comment.trim() || undefined,
    });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setData((prev) => (prev ? { ...prev, status: 'CHECKED', grade: grade.trim(), comment: comment.trim() || null } : prev));
      router.refresh();
    } else {
      setSaveError(result.error ?? 'Не удалось сохранить оценку. Проверьте соединение.');
    }
  }, [grade, comment, submissionId, router]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Проверка решения ученика"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card text-card-foreground shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка модалки */}
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {data ? data.studentName : 'Загрузка...'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {data?.homeworkTitle ?? ''}
              {data?.studentGradeClass ? ` · ${data.studentGradeClass}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Тело */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {loadError && (
            <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {loadError}
            </p>
          )}
          {!data && !loadError && (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Загрузка решения...
            </div>
          )}

          {data && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <User className="h-4 w-4" />
                {data.studentName}
                {data.submittedAt && (
                  <span>· отправлено {new Date(data.submittedAt).toLocaleString('ru-RU')}</span>
                )}
                {data.status === 'CHECKED' ? (
                  <Badge variant="success">Проверено · оценка {data.grade}</Badge>
                ) : (
                  <Badge variant="warning">Ждёт проверки</Badge>
                )}
              </div>

              {data.answers.map((answer) => (
                <div key={answer.taskId} className="rounded-lg border border-border p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">Задача {answer.taskOrder}</p>
                    {answer.isCorrect === true && (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Верно
                      </Badge>
                    )}
                    {answer.isCorrect === false && (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" /> Неверно
                      </Badge>
                    )}
                    {answer.isCorrect === null && (
                      <Badge variant="outline" className="gap-1">
                        <SendHorizontal className="h-3 w-3" /> Нужна ручная проверка
                      </Badge>
                    )}
                  </div>

                  <MathRender content={answer.taskContent} className="mb-2 text-sm text-muted-foreground" />

                  <p className="text-sm text-foreground">
                    <span className="font-medium">Ответ:</span>{' '}
                    {answer.textAnswer || <span className="italic text-muted-foreground">— пусто —</span>}
                  </p>
                  {answer.correctAnswer !== null && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Эталон: <span className="font-mono">{answer.correctAnswer}</span>
                    </p>
                  )}
                  {answer.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={answer.photoUrl}
                      alt={`Фото-ответ к задаче ${answer.taskOrder}`}
                      className="mt-2 max-h-64 rounded-lg border border-border object-contain"
                    />
                  ) : answer.requirePhoto ? (
                    <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                      Фото-ответ не загружен (обязателен)
                    </p>
                  ) : null}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Форма оценки */}
        {data && (
          <div className="space-y-2 border-t border-border px-4 py-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr]">
              <Input
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value);
                  setSaved(false);
                }}
                placeholder="Оценка (напр. 5)"
                aria-label="Оценка"
              />
              <Textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setSaved(false);
                }}
                placeholder="Комментарий ученику (необязательно)"
                rows={1}
                aria-label="Комментарий учителя"
              />
            </div>
            {saveError && (
              <p className="flex flex-wrap items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {saveError}
                <Button type="button" variant="outline" size="sm" onClick={() => void handleGrade()} disabled={saving}>
                  Повторить
                </Button>
              </p>
            )}
            {saved && !saveError && (
              <p className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Оценка сохранена
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Закрыть
              </Button>
              <Button type="button" onClick={() => void handleGrade()} disabled={saving || !grade.trim()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {data.status === 'CHECKED' ? 'Обновить оценку' : 'Проверить и оценить'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
