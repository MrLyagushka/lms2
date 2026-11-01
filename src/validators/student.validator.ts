import { z } from 'zod';

/**
 * Схема валидации кода учителя.
 * Приводит ввод к uppercase на сервере (регистронезависимость).
 */
export const teacherCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(
    z
      .string()
      .length(6, 'Код учителя должен содержать ровно 6 символов')
      .regex(/^[A-Z0-9]{6}$/, 'Код учителя состоит только из заглавных букв (A–Z) и цифр (0–9)')
  );

export type TeacherCodeInput = z.infer<typeof teacherCodeSchema>;
