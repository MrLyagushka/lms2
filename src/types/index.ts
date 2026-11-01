// src/types/index.ts
// Глобальные типы приложения.

export type UserRole = 'TEACHER' | 'STUDENT';

export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'CHECKED';

export type {
  User,
  TeacherProfile,
  StudentProfile,
  Homework,
  Task,
  Submission,
  Answer,
} from '@prisma/client';

/**
 * DTO ученика для таблицы "Мои ученики" (Server Component -> клиентский компонент).
 * Даты сериализуются в ISO-строки, чтобы избежать проблем на границе Server -> Client.
 */
export interface StudentListItemDTO {
  id: string;
  fullName: string;
  email: string;
  grade: string | null;
  notes: string | null;
  createdAt: string; // ISO-string
}

/**
 * Универсальный результат Server Action.
 */
export interface ActionResult<T = undefined> {
  error?: string;
  success?: boolean;
  data?: T;
}
