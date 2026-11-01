// src/components/homework/solve-homework.tsx
// Клиентский компонент решения ДЗ учеником (ПРОМТ-13):
// - список задач с рендером LaTeX через MathRender;
// - поле ответа (textarea) с автосохранением через useAutosave (debounce 1.5с);
// - загрузка фото-ответа (input file → uploadPhotoAction → saveAnswerAction);
// - индикаторы «Сохранение... / Сохранено / Ошибка» + повтор при ошибке сети;
// - кнопка «Отправить ДЗ» (disabled, если не загружены обязательные фото);
// - при SUBMITTED/CHECKED — режим «только чтение» с результатом проверки.

'use client';

import { useCallback, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  CloudUpload,
  Loader2,
  RefreshCw,
  RotateCcw,
  Send,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MathRender } from '@/components/math/math-render';
import { useAutosave, type AutosaveStatus } from '@/hooks/use-autosave';
import {
  saveAnswerAction,
  submitHomeworkAction,
  uploadPhotoAction,
} from '@/server/homework.actions';
import type { AutoCheckResult, StudentHomeworkSolveDTO, TaskItemDTO } from '@/types';

// ─────────────── Индикатор статуса автосохранения ───────────────

function SaveIndicator({ status, onRetry }: { status: AutosaveStatus; onRetry: () => void }) {
  if (status === 'idle') return null;

  return (
    <div className="mt-1 flex items-center gap-2 text-xs">
      {status === 'saving' && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Сохранение...
        </span>
      )}
      {status === 'saved' && (
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Сохранено
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3" />
          Не удалось сохранить
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:opacity-80"
          >
            <RefreshCw className="h-3 w-3" />
            Повторить
          </button>
        </span>
      )}
    </div>
  );
}

// ─────────────── Одна задача + ответ ученика ───────────────

interface TaskBlockProps {
  task: TaskItemDTO;
  readOnly: boolean;
  initialText: string;
  initialPhotoUrl: string | null;
  isCorrect: boolean | null;
  /** Есть ли у задачи эталон для автопроверки (correctAnswer). */
  hasCorrectAnswer: boolean;
  /** Вызывается после успешного сохранения; может вернуть id созданной Submission. */
  onSaved: (submissionId: string) => void;
  getSubmissionId: () => string | null;
}

function TaskBlock({
  task,
  readOnly,
  initialText,
  initialPhotoUrl,
  isCorrect,
  hasCorrectAnswer,
  onSaved,
  getSubmissionId,
}: TaskBlockProps) {
  const [text, setText] = useState(initialText);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Автосохранение текста: debounce 1500мс, статус для индикатора
  const onSave = useCallback(
    async (value: string) => {
      const result = await saveAnswerAction(getSubmissionId(), task.id, { textAnswer: value });
      if (result.error) throw new Error(result.error);
      if (result.data?.submissionId) onSaved(result.data.submissionId);
    },
    [getSubmissionId, onSaved, task.id]
  );

  const { status, retry } = useAutosave({ value: text, onSave, delay: 1500 });

  // Загрузка фото: FormData не нужна как таковая — Server Action принимает File,
  // но по ТЗ идём через FormData → uploadPhotoAction(file)
  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setUploading(true);
      setUploadError(null);
      try {
        const form = new FormData();
        form.append('photo', file);
        const uploaded = await uploadPhotoAction(form.get('photo') as File);
        if (!uploaded.success || !uploaded.data) {
          throw new Error(uploaded.error ?? 'Ошибка загрузки');
        }
        const result = await saveAnswerAction(getSubmissionId(), task.id, {
          photoUrl: uploaded.data.url,
        });
        if (result.error) throw new Error(result.error);
        if (result.data?.submissionId) onSaved(result.data.submissionId);
        setPhotoUrl(uploaded.data.url);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Не удалось загрузить фото');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [getSubmissionId, onSaved, task.id]
  );

  const removePhoto = useCallback(async () => {
    setUploading(true);
    setUploadError(null);
    try {
      const result = await saveAnswerAction(getSubmissionId(), task.id, { photoUrl: null });
      if (result.error) throw new Error(result.error);
      if (result.data?.submissionId) onSaved(result.data.submissionId);
      setPhotoUrl(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Не удалось удалить фото');
    } finally {
      setUploading(false);
    }
  }, [getSubmissionId, onSaved, task.id]);

  // Подсветка карточки по результату автопроверки (ПРОМТ-14):
  // зелёная — верно, красная — неверно; без эталона в режиме чтения — «на проверке»
  const cardTone = !readOnly
    ? undefined
    : isCorrect === true
      ? 'border-emerald-500/60 bg-emerald-500/5'
      : isCorrect === false
        ? 'border-red-500/60 bg-red-500/5'
        : undefined;

  return (
    <Card className={cardTone}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">
            Задача {task.order}
            {task.requirePhoto && (
              <Badge variant="secondary" className="ml-2 align-middle">
                нужно фото
              </Badge>
            )}
          </CardTitle>
          {/* Результат автопроверки */}
          {readOnly && isCorrect === true && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Верно
            </Badge>
          )}
          {readOnly && isCorrect === false && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              Неверно
            </Badge>
          )}
          {readOnly && isCorrect === null && !hasCorrectAnswer && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              Отправлено на проверку
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Условие задачи с LaTeX */}
        <MathRender content={task.content} className="text-sm leading-relaxed text-foreground" />

        {/* Текстовый ответ */}
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor={`answer-${task.id}`}>
            Ответ
          </label>
          <Textarea
            id={`answer-${task.id}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            readOnly={readOnly}
            placeholder={readOnly ? '—' : 'Введите ответ...'}
            rows={3}
          />
          {!readOnly && <SaveIndicator status={status} onRetry={retry} />}
        </div>

        {/* Фото-ответ */}
        {(task.requirePhoto || photoUrl) && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Фото-ответ {task.requirePhoto && <span className="text-red-500">*</span>}
            </p>

            {photoUrl ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt={`Фото к задаче ${task.order}`}
                  className="max-h-64 rounded-lg border border-border object-contain"
                />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => void removePhoto()}
                    aria-label="Удалить фото"
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              !readOnly && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handleFile(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CloudUpload className="mr-2 h-4 w-4" />
                    )}
                    {uploading ? 'Загрузка...' : 'Загрузить фото'}
                  </Button>
                </div>
              )
            )}

            {uploadError && (
              <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3 w-3" />
                {uploadError}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-medium underline underline-offset-2"
                >
                  Повторить
                </button>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────── Основной компонент ───────────────

export function SolveHomework({ homework }: { homework: StudentHomeworkSolveDTO }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Локальное состояние submission: id создаётся при первом автосейве,
  // статус меняется при отправке.
  const [submissionId, setSubmissionId] = useState<string | null>(homework.submission?.id ?? null);
  const [status, setStatus] = useState<'DRAFT' | 'SUBMITTED' | 'CHECKED'>(
    homework.submission?.status ?? 'DRAFT'
  );
  // Результат автопроверки после отправки (ПРОМТ-14) — обновляется сервером при refresh
  const [autoCheck, setAutoCheck] = useState<AutoCheckResult | null>(
    homework.submission?.autoCheck ?? null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const submissionIdRef = useRef(submissionId);
  // Синхронизируем ref — колбэки автосейва читают актуальный id без stale closure
  submissionIdRef.current = submissionId;

  const readOnly = status === 'SUBMITTED' || status === 'CHECKED';

  const answersByTask = useMemo(() => {
    const map = new Map<string, { textAnswer: string; photoUrl: string | null; isCorrect: boolean | null }>();
    for (const a of homework.submission?.answers ?? []) {
      map.set(a.taskId, { textAnswer: a.textAnswer ?? '', photoUrl: a.photoUrl, isCorrect: a.isCorrect });
    }
    return map;
  }, [homework.submission]);

  const handleSaved = useCallback((id: string) => {
    setSubmissionId((prev) => {
      if (prev === id) return prev;
      submissionIdRef.current = id;
      return id;
    });
  }, []);

  const getSubmissionId = useCallback(() => submissionIdRef.current, []);

  // Простейший toast-хелпер (без сторонних библиотек)
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!submissionId) {
      showToast('Сначала начните решать — ответы сохранятся автоматически');
      return;
    }
    setSubmitError(null);
    startTransition(async () => {
      const result = await submitHomeworkAction(submissionId);
      if (result.success && result.data) {
        setStatus('SUBMITTED');
        setAutoCheck({
          correct: result.data.correct,
          autoChecked: result.data.autoChecked,
          totalTasks: result.data.totalTasks,
        });
        showToast(
          result.data.autoChecked > 0
            ? `ДЗ отправлено. Правильных ответов: ${result.data.correct} из ${result.data.autoChecked}`
            : 'ДЗ отправлено учителю ✅'
        );
        router.refresh();
      } else {
        setSubmitError(result.error ?? 'Не удалось отправить ДЗ. Проверьте соединение.');
      }
    });
  }, [submissionId, showToast, router]);

  const missingRequiredPhotos = homework.tasks.some(
    (t) => t.requirePhoto && !answersByTask.get(t.id)?.photoUrl
  );

  const deadlineInfo = (() => {
    if (!homework.deadline) return null;
    const d = new Date(homework.deadline);
    const diff = d.getTime() - Date.now();
    const formatted = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
    if (diff < 0 && !readOnly) return { label: `Просрочено: ${formatted}`, urgent: true };
    if (diff < 24 * 60 * 60 * 1000 && !readOnly) return { label: `Осталось меньше суток: ${formatted}`, urgent: true };
    return { label: `До ${formatted}`, urgent: false };
  })();

  return (
    <div className="space-y-6">
      {/* Шапка ДЗ */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/student/homework"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            ← К списку ДЗ
          </Link>
          <StatusBadge status={status} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{homework.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {homework.teacherName}
          </span>
          {deadlineInfo && (
            <span
              className={cn(
                'flex items-center gap-1',
                deadlineInfo.urgent && 'font-medium text-red-600 dark:text-red-400'
              )}
            >
              <CalendarClock className="h-4 w-4" />
              {deadlineInfo.label}
            </span>
          )}
          <span>{homework.tasks.length} задач</span>
        </div>
        {homework.description && (
          <p className="text-sm text-muted-foreground">{homework.description}</p>
        )}
      </div>

      {/* Баннер результата проверки */}
      {status === 'CHECKED' && (
        <Card className="border-emerald-500/50 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-foreground">ДЗ проверено учителем</p>
              <p className="text-sm text-muted-foreground">
                Оценка: <span className="font-semibold text-foreground">{homework.submission?.grade ?? '—'}</span>
                {homework.submission?.submittedAt && (
                  <>
                    {' '}· отправлено{' '}
                    {new Date(homework.submission.submittedAt).toLocaleDateString('ru-RU')}
                  </>
                )}
              </p>
              {homework.submission?.comment && (
                <p className="mt-1 text-sm text-foreground">
                  Комментарий учителя: <span className="italic">{homework.submission.comment}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {status === 'SUBMITTED' && (
        <Card className="border-sky-500/50 bg-sky-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Send className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" />
            <p className="text-sm text-foreground">
              ДЗ отправлено учителю
              {homework.submission?.submittedAt &&
                ` ${new Date(homework.submission.submittedAt).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`}
              . Ответы изменять нельзя — ждите проверки.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Результат автопроверки (ПРОМТ-14): «Правильных ответов: X из Y» */}
      {readOnly && autoCheck && autoCheck.autoChecked > 0 && (
        <Card className="border-primary/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4">
            <p className="text-sm font-medium text-foreground">
              Правильных ответов: {autoCheck.correct} из {autoCheck.autoChecked}
            </p>
            <p className="text-xs text-muted-foreground">
              {autoCheck.totalTasks - autoCheck.autoChecked > 0
                ? `${autoCheck.totalTasks - autoCheck.autoChecked} задач без автопроверки — их оценит учитель`
                : 'Все задачи проверены автоматически'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Задачи */}
      <div className="space-y-4">
        {homework.tasks.map((task) => {
          const answer = answersByTask.get(task.id);
          return (
            <TaskBlock
              key={task.id}
              task={task}
              readOnly={readOnly}
              initialText={answer?.textAnswer ?? ''}
              initialPhotoUrl={answer?.photoUrl ?? null}
              isCorrect={answer?.isCorrect ?? null}
              hasCorrectAnswer={task.correctAnswer !== null}
              onSaved={handleSaved}
              getSubmissionId={getSubmissionId}
            />
          );
        })}
      </div>

      {/* Отправка */}
      {!readOnly && (
        <div className="space-y-2 rounded-lg border border-border bg-card p-4">
          {submitError && (
            <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              {submitError}
              <Button type="button" variant="outline" size="sm" onClick={handleSubmit}>
                <RotateCcw className="mr-1 h-3 w-3" />
                Повторить
              </Button>
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Ответы сохраняются автоматически. Перед отправкой убедитесь, что все ответы
              показаны как «Сохранено».
            </p>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !submissionId || missingRequiredPhotos}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Отправить ДЗ
            </Button>
          </div>
          {missingRequiredPhotos && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              Для некоторых задач требуется фото-ответ — сначала загрузите их.
            </p>
          )}
        </div>
      )}

      {/* Toast (ошибки сети / успех отправки) */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ─────────────── Вспомогательные ───────────────

function StatusBadge({ status }: { status: 'DRAFT' | 'SUBMITTED' | 'CHECKED' }) {
  if (status === 'CHECKED') return <Badge variant="success">Проверено</Badge>;
  if (status === 'SUBMITTED') return <Badge>Отправлено</Badge>;
  return <Badge variant="warning">Черновик</Badge>;
}
