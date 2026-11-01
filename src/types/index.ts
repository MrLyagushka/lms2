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

/**
 * Ответ ученика на задачу (в рамках Submission).
 */
export interface AnswerItemDTO {
  taskId: string;
  textAnswer: string | null;
  photoUrl: string | null;
  isCorrect: boolean | null; // результат автопроверки (null — не проверено)
}

/** Результат автопроверки после отправки ДЗ (ПРОМТ-14). */
export interface AutoCheckResult {
  correct: number; // правильных ответов по автопроверке
  autoChecked: number; // задач с эталоном correctAnswer
  totalTasks: number; // всего задач в ДЗ
}

/**
 * Текущая Submission ученика на конкретное ДЗ (или null, если ещё не начинал).
 */
export interface StudentSubmissionDTO {
  id: string;
  status: SubmissionStatus; // 'DRAFT' | 'SUBMITTED' | 'CHECKED'
  submittedAt: string | null; // ISO-string
  grade: string | null;
  comment: string | null; // комментарий учителя при проверке
  /** Результат автопроверки (есть, если ДЗ отправлено и были задачи с эталоном). */
  autoCheck: AutoCheckResult | null;
  answers: AnswerItemDTO[];
}

/**
 * DTO ДЗ для страницы решения учеником: задачи + текущая submission.
 */
export interface StudentHomeworkSolveDTO {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null; // ISO-string
  teacherName: string;
  tasks: TaskItemDTO[];
  submission: StudentSubmissionDTO | null;
}

/**
 * Решение ученика в списке для страницы проверки учителем (ПРОМТ-14).
 */
export interface SubmissionSummaryDTO {
  id: string;
  studentId: string;
  studentName: string;
  status: 'SUBMITTED' | 'CHECKED';
  submittedAt: string | null; // ISO-string
  grade: string | null;
  correctCount: number; // верно по автопроверке
  checkedCount: number; // задач с автопроверкой
  totalTasks: number; // всего задач в ДЗ
}

/**
 * ДЗ для страницы «Проверка ДЗ» учителя: задачи + все отправленные решения.
 */
export interface TeacherHomeworkReviewDTO {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null; // ISO-string
  createdAt: string; // ISO-string
  totalTasks: number;
  tasks: TaskItemDTO[];
  submissions: SubmissionSummaryDTO[];
}

/**
 * Один ответ ученика с данными задачи (для модалки проверки).
 */
export interface ReviewAnswerDTO {
  taskId: string;
  taskOrder: number;
  taskContent: string;
  correctAnswer: string | null;
  requirePhoto: boolean;
  textAnswer: string | null;
  photoUrl: string | null;
  isCorrect: boolean | null;
}

/**
 * Полное решение ученика для модалки проверки учителем.
 */
export interface SubmissionReviewDTO {
  id: string;
  status: 'SUBMITTED' | 'CHECKED';
  submittedAt: string | null; // ISO-string
  grade: string | null;
  comment: string | null;
  studentName: string;
  studentGradeClass: string | null;
  homeworkTitle: string;
  answers: ReviewAnswerDTO[];
}
