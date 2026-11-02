// src/validators/auth.validator.ts
// Схемы валидации форм входа и регистрации.

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Укажите e-mail').email('Некорректный e-mail'),
  password: z.string().min(1, 'Укажите пароль'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Укажите ФИО (минимум 2 символа)')
      .max(120, 'Слишком длинное имя'),
    email: z.string().trim().min(1, 'Укажите e-mail').email('Некорректный e-mail'),
    password: z
      .string()
      .min(6, 'Пароль должен содержать минимум 6 символов')
      .max(72, 'Пароль слишком длинный'),
    role: z.enum(['TEACHER', 'STUDENT'], {
      errorMap: () => ({ message: 'Выберите роль: учитель или ученик' }),
    }),
  })
  // На сервере хеш пароля тоже попадает в String — ограничим длину на всякий случай
  .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email), 'Некорректный e-mail');

export type RegisterInput = z.infer<typeof registerSchema>;
