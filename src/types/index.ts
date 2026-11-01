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

/**
 * DTO задачи для передачи на клиент (даты — ISO-строки).
 */
export interface TaskItemDTO {
  id: string;
  order: number;
  content: string;
  correctAnswer: string | null;
  requirePhoto: boolean;
}

/**
 * DTO домашнего задания для списка/просмотра.
 */
export interface HomeworkItemDTO {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null; // ISO-string
  createdAt: string; // ISO-string
  tasksCount: number;
  submissionsCount: number;
}

/**
 * DTO ДЗ вместе с задачами (детальная страница).
 */
export interface HomeworkDetailDTO extends HomeworkItemDTO {
  tasks: TaskItemDTO[];
}

/**
 * Статус решения ДЗ конкретным учеником:
 *   NONE      — решения нет (ученик ещё не начинал)
 *   DRAFT     — черновик (ученик уже начал решать)
 *   SUBMITTED — отправлено учителю
 *   CHECKED   — проверено учителем
 */
export type StudentHomeworkStatus = 'NONE' | 'DRAFT' | 'SUBMITTED' | 'CHECKED';

/**
 * DTO ДЗ для вкладки «Домашние задания» ученика.
 * Включает имя учителя и статус решения текущим учеником.
 */
export interface StudentHomeworkItemDTO {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null; // ISO-string
  createdAt: string; // ISO-string
  tasksCount: number;
  teacherName: string;
  status: StudentHomeworkStatus;
  grade: string | null; // оценка, если ДЗ проверено
}
