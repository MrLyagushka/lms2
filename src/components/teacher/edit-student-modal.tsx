// src/components/teacher/edit-student-modal.tsx
// Модальное окно редактирования данных ученика учителем.
// React Hook Form + Zod, отправка через Server Action + router.refresh().

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateStudentByTeacherAction } from '@/server/teacher.actions';
import type { StudentListItemDTO } from '@/types';

const editStudentSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(100, 'Не более 100 символов'),
  grade: z.string().trim().max(30, 'Не более 30 символов'),
  notes: z.string().trim().max(1000, 'Заметки — не более 1000 символов'),
});

type EditStudentFormValues = z.infer<typeof editStudentSchema>;

interface EditStudentModalProps {
  student: StudentListItemDTO;
  open: boolean;
  onClose: () => void;
}

export function EditStudentModal({ student, open, onClose }: EditStudentModalProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditStudentFormValues>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      fullName: student.fullName,
      grade: student.grade ?? '',
      notes: student.notes ?? '',
    },
  });

  // Сброс формы при смене ученика / повторном открытии
  useEffect(() => {
    if (open) {
      reset({
        fullName: student.fullName,
        grade: student.grade ?? '',
        notes: student.notes ?? '',
      });
      setSubmitError(null);
    }
  }, [open, student, reset]);

  // Закрытие по Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onSubmit = async (values: EditStudentFormValues): Promise<void> => {
    setSubmitError(null);
    const formData = new FormData();
    formData.set('studentId', student.id);
    formData.set('fullName', values.fullName);
    formData.set('grade', values.grade);
    formData.set('notes', values.notes);

    const result = await updateStudentByTeacherAction(formData);
    if (result?.error) {
      setSubmitError(result.error);
      return;
    }
    router.refresh(); // обновить серверные данные списка
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Редактирование ученика ${student.fullName}`}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Редактировать ученика</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="fullName" className="text-sm font-medium text-foreground">
              Имя ученика
            </label>
            <input
              id="fullName"
              type="text"
              {...register('fullName')}
              className={cn(
                'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                errors.fullName && 'border-destructive'
              )}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="grade" className="text-sm font-medium text-foreground">
              Класс
            </label>
            <input
              id="grade"
              type="text"
              placeholder="Например: 7Б"
              {...register('grade')}
              className={cn(
                'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                errors.grade && 'border-destructive'
              )}
            />
            {errors.grade && <p className="text-xs text-destructive">{errors.grade.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="notes" className="text-sm font-medium text-foreground">
              Заметки
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Личные заметки об ученике"
              {...register('notes')}
              className={cn(
                'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                errors.notes && 'border-destructive'
              )}
            />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
          </div>

          {submitError && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                'hover:bg-primary/90 disabled:opacity-60'
              )}
            >
              {isSubmitting ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
