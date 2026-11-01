// src/validators/homework.validator.ts
// Zod-схемы для создания ДЗ (используются и на клиенте в форме, и на сервере в Server Action).

import { z } from 'zod';

/**
 * Одна задача внутри ДЗ.
 * content — текст задачи, может содержать LaTeX ($...$, $$...$$).
 * correctAnswer — опциональный эталон для автопроверки.
 */
export const taskSchema = z.object({
  content: z.string().trim().min(1, 'Текст задачи не может быть пустым'),
  correctAnswer: z.string().trim().optional(),
  requirePhoto: z.boolean().default(false),
});

/**
 * Создание ДЗ: обязательный заголовок, минимум одна задача.
 * deadline — строка из <input type="date"> ("YYYY-MM-DD") или undefined.
 */
export const createHomeworkSchema = z.object({
  title: z.string().trim().min(1, 'Название ДЗ обязательно').max(200, 'Максимум 200 символов'),
  description: z.string().trim().max(2000, 'Максимум 2000 символов').optional(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Некорректная дата дедлайна')
    .optional()
    .or(z.literal('')),
  tasks: z
    .array(taskSchema)
    .min(1, 'Добавьте хотя бы одну задачу')
    .max(50, 'Максимум 50 задач в одном ДЗ'),
});

export type TaskInput = z.infer<typeof taskSchema>;
export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>;
