// src/validators/teacher.validator.ts
// Zod-схемы для действий учителя (редактирование данных учеников).

import { z } from 'zod';

/**
 * Данные ученика, которые учитель может редактировать.
 */
export const updateStudentByTeacherSchema = z.object({
  studentId: z.string().min(1, 'Не передан ID ученика'),
  fullName: z.string().trim().min(2, 'Имя должно содержать минимум 2 символа').max(100),
  grade: z
    .string()
    .trim()
    .max(30, 'Не более 30 символов')
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null)),
  notes: z
    .string()
    .trim()
    .max(1000, 'Заметки — не более 1000 символов')
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export type UpdateStudentByTeacherInput = z.infer<typeof updateStudentByTeacherSchema>;
