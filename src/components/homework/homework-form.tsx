// src/components/homework/homework-form.tsx
// Клиентская форма создания ДЗ: общие поля + динамический список задач (useFieldArray).

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createHomeworkSchema, type CreateHomeworkInput } from '@/validators/homework.validator';
import { createHomeworkAction } from '@/server/homework.actions';

const fieldClass =
  'mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const errorClass = 'mt-1 text-xs text-destructive';
const labelClass = 'text-sm font-medium text-foreground';

export function HomeworkForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateHomeworkInput>({
    resolver: zodResolver(createHomeworkSchema),
    defaultValues: {
      title: '',
      description: '',
      deadline: '',
      tasks: [{ content: '', correctAnswer: '', requirePhoto: false }],
    },
    mode: 'onSubmit',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tasks',
  });

  const onSubmit: SubmitHandler<CreateHomeworkInput> = async (values) => {
    setServerError(null);
    const result = await createHomeworkAction(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    router.push('/teacher/homework');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* ── Общие поля ДЗ ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Параметры домашнего задания</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="title" className={labelClass}>
              Название <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="Например: Квадратные уравнения"
              className={fieldClass}
              {...register('title')}
            />
            {errors.title && <p className={errorClass}>{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Описание (опционально)
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Краткое описание ДЗ. Можно использовать LaTeX: $x^2 + y^2 = r^2$"
              className={fieldClass}
              {...register('description')}
            />
            {errors.description && <p className={errorClass}>{errors.description.message}</p>}
          </div>

          <div className="w-full sm:w-64">
            <label htmlFor="deadline" className={labelClass}>
              Дедлайн (опционально)
            </label>
            <input id="deadline" type="date" className={fieldClass} {...register('deadline')} />
            {errors.deadline && <p className={errorClass}>{errors.deadline.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* ── Список задач ── */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Задача №{index + 1}</CardTitle>
              {fields.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => remove(index)}
                  aria-label={`Удалить задачу ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor={`tasks.${index}.content`} className={labelClass}>
                  Текст задачи <span className="text-destructive">*</span>
                </label>
                <textarea
                  id={`tasks.${index}.content`}
                  rows={3}
                  placeholder={'Условие задачи. Формулы — в LaTeX, например: Решите $x^2 - 5x + 6 = 0$'}
                  className={fieldClass}
                  {...register(`tasks.${index}.content` as const)}
                />
                {errors.tasks?.[index]?.content && (
                  <p className={errorClass}>{errors.tasks[index]?.content?.message}</p>
                )}
              </div>

              <div>
                <label htmlFor={`tasks.${index}.correctAnswer`} className={labelClass}>
                  Правильный ответ (опционально, для автопроверки)
                </label>
                <input
                  id={`tasks.${index}.correctAnswer`}
                  type="text"
                  placeholder="Например: x=2, x=3"
                  className={fieldClass}
                  {...register(`tasks.${index}.correctAnswer` as const)}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  {...register(`tasks.${index}.requirePhoto` as const)}
                />
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Требовать фото решения
              </label>
            </CardContent>
          </Card>
        ))}

        {errors.tasks?.root?.message && (
          <p className={errorClass}>{errors.tasks.root.message}</p>
        )}
      </div>

      {/* ── Действия ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          variant="outline"
          onClick={() => append({ content: '', correctAnswer: '', requirePhoto: false })}
        >
          <Plus className="h-4 w-4" />
          Добавить задачу
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Создание…' : 'Создать ДЗ'}
        </Button>
      </div>

      {serverError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}
    </form>
  );
}
