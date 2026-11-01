// src/server/homework.actions.ts
// Server Actions для домашнего задания: создание (транзакция Homework + Task),
// список ДЗ учителя, получение одного ДЗ с задачами, удаление,
// решение ДЗ учеником (getHomeworkForStudentAction / saveAnswerAction /
// submitHomeworkAction / uploadPhotoAction).

'use server';

import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { createHomeworkSchema, saveAnswerSchema, gradeSubmissionSchema } from '@/validators/homework.validator';
import type {
  ActionResult,
  HomeworkItemDTO,
  HomeworkDetailDTO,
  StudentHomeworkItemDTO,
  StudentHomeworkSolveDTO,
  StudentHomeworkStatus,
  TeacherHomeworkReviewDTO,
  SubmissionReviewDTO,
} from '@/types';

// ─────────────── Автопроверка ответов (ПРОМТ-14) ───────────────

/**
 * Нормализация ответа для автопроверки:
 * trim, lowercase, удаление всех пробелов (в т.ч. вокруг операторов),
 * нормализация минуса/умножения и десятичного разделителя.
 */
export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s\u00A0]+/g, '') // игнорируем пробелы вокруг операторов и внутри
    .replace(/[−–—]/g, '-') // все виды минусов → обычный дефис
    .replace(/[×✕∗*]/g, 'x') // знаки умножения → x
    .replace(/,/g, '.'); // запятая как десятичный разделитель → точка
}

/** Сравнивает ответ ученика с эталоном (после нормализации). */
export function checkAnswer(textAnswer: string | null | undefined, correctAnswer: string): boolean {
  if (textAnswer === null || textAnswer === undefined) return false;
  const a = normalizeAnswer(textAnswer);
  const b = normalizeAnswer(correctAnswer);
  if (!a || !b) return false;
  if (a === b) return true;
  // Числовое сравнение: "3" и "3.0", "1/2" и "0.5" считаются равными
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na === nb;
  return false;
}

// ─────────────── Внутренние guard-хелперы ───────────────

type Guard = { profileId: string } | { error: string };

async function requireTeacherProfileId(): Promise<Guard> {
  const session = await getSessionUser();
  if (!session || session.role !== 'TEACHER') {
    return { error: 'Доступ только для учителей' };
  }
  const profile = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
  if (!profile) return { error: 'Профиль учителя не найден' };
  return { profileId: profile.id };
}

type StudentGuard = { studentProfileId: string } | { error: string };

async function requireStudentProfileId(): Promise<StudentGuard> {
  const session = await getSessionUser();
  if (!session || session.role !== 'STUDENT') {
    return { error: 'Доступ только для учеников' };
  }
  const profile = await db.studentProfile.findUnique({ where: { userId: session.userId } });
  if (!profile) return { error: 'Профиль ученика не найден' };
  return { studentProfileId: profile.id };
}

function toHomeworkItem(hw: {
  id: string;
  title: string;
  description: string | null;
  deadline: Date | null;
  createdAt: Date;
  _count?: { tasks: number; submissions: number };
  tasks?: { length: number };
}): HomeworkItemDTO {
  return {
    id: hw.id,
    title: hw.title,
    description: hw.description,
    deadline: hw.deadline ? hw.deadline.toISOString() : null,
    createdAt: hw.createdAt.toISOString(),
    tasksCount: hw._count?.tasks ?? hw.tasks?.length ?? 0,
    submissionsCount: hw._count?.submissions ?? 0,
  };
}

// ─────────────── Создание ДЗ ───────────────

export async function createHomeworkAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireTeacherProfileId();
  if ('error' in guard) return { error: guard.error };

  const parsed = createHomeworkSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Ошибка валидации данных ДЗ' };
  }

  const { title, description, deadline, tasks } = parsed.data;

  try {
    const homework = await db.$transaction(async (tx) => {
      const created = await tx.homework.create({
        data: {
          teacherId: guard.profileId,
          title,
          description: description && description.length > 0 ? description : null,
          deadline: deadline ? new Date(`${deadline}T23:59:59.000Z`) : null,
        },
      });

      await tx.task.createMany({
        data: tasks.map((task, index) => ({
          homeworkId: created.id,
          order: index + 1,
          content: task.content,
          correctAnswer:
            task.correctAnswer && task.correctAnswer.length > 0 ? task.correctAnswer : null,
          requirePhoto: task.requirePhoto,
        })),
      });

      return created;
    });

    revalidatePath('/teacher/homework');
    return { success: true, data: { id: homework.id } };
  } catch (err) {
    console.error('createHomeworkAction error:', err);
    return { error: 'Не удалось создать ДЗ. Попробуйте позже.' };
  }
}

// ─────────────── Список ДЗ учителя ───────────────

export async function getTeacherHomeworksAction(): Promise<ActionResult<HomeworkItemDTO[]>> {
  const guard = await requireTeacherProfileId();
  if ('error' in guard) return { error: guard.error };

  const homeworks = await db.homework.findMany({
    where: { teacherId: guard.profileId },
    include: { _count: { select: { tasks: true, submissions: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return { success: true, data: homeworks.map(toHomeworkItem) };
}

// ─────────────── Одно ДЗ с задачами (только своё) ───────────────

export async function getHomeworkByIdAction(id: string): Promise<ActionResult<HomeworkDetailDTO>> {
  const guard = await requireTeacherProfileId();
  if ('error' in guard) return { error: guard.error };

  const homework = await db.homework.findFirst({
    where: { id, teacherId: guard.profileId }, // проверка: это ДЗ текущего учителя
    include: {
      tasks: { orderBy: { order: 'asc' } },
      _count: { select: { tasks: true, submissions: true } },
    },
  });

  if (!homework) {
    return { error: 'Домашнее задание не найдено или вам недоступно' };
  }

  return {
    success: true,
    data: {
      ...toHomeworkItem(homework),
      tasks: homework.tasks.map((t) => ({
        id: t.id,
        order: t.order,
        content: t.content,
        correctAnswer: t.correctAnswer,
        requirePhoto: t.requirePhoto,
      })),
    },
  };
}

// ─────────────── Удаление ДЗ (если никто не начал решать) ───────────────

export async function deleteHomeworkAction(id: string): Promise<ActionResult> {
  const guard = await requireTeacherProfileId();
  if ('error' in guard) return { error: guard.error };

  const homework = await db.homework.findFirst({
    where: { id, teacherId: guard.profileId },
    include: { _count: { select: { submissions: true } } },
  });

  if (!homework) {
    return { error: 'Домашнее задание не найдено или вам недоступно' };
  }

  if (homework._count.submissions > 0) {
    return { error: 'Нельзя удалить: ученики уже начали решать это ДЗ' };
  }

  try {
    // tasks удалятся каскадно (onDelete: Cascade), submission-ов нет по условию выше
    await db.homework.delete({ where: { id } });
    revalidatePath('/teacher/homework');
    return { success: true };
  } catch (err) {
    console.error('deleteHomeworkAction error:', err);
    return { error: 'Не удалось удалить ДЗ. Попробуйте позже.' };
  }
}

// ─────────────── Список ДЗ для ученика (с статусом решения) ───────────────

/**
 * Возвращает все ДЗ учителя, к которому привязан текущий ученик,
 * вместе со статусом решения этим учеником:
 *   NONE — решения нет; DRAFT — черновик; SUBMITTED — отправлено; CHECKED — проверено.
 *
 * Особый случай: если у ученика нет привязанного учителя, возвращается
 * success с пустым списком и teacherName === null — страница покажет баннер
 * с предложением привязаться.
 */
export async function getStudentHomeworksAction(): Promise<
  ActionResult<{ teacherName: string | null; homeworks: StudentHomeworkItemDTO[] }>
> {
  const guard = await requireStudentProfileId();
  if ('error' in guard) return { error: guard.error };

  const studentProfile = await db.studentProfile.findUnique({
    where: { id: guard.studentProfileId },
    include: { teacher: { select: { id: true, fullName: true } } },
  });

  if (!studentProfile) {
    return { error: 'Профиль ученика не найден' };
  }

  // Учитель не привязан — ДЗ нет, но это не ошибка
  if (!studentProfile.teacher) {
    return { success: true, data: { teacherName: null, homeworks: [] } };
  }

  const homeworks = await db.homework.findMany({
    where: { teacherId: studentProfile.teacher.id },
    include: {
      _count: { select: { tasks: true } },
      submissions: {
        where: { studentId: studentProfile.id },
        select: { status: true, grade: true },
        take: 1, // @@unique([studentId, homeworkId]) — не больше одной
      },
    },
    orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
  });

  const items: StudentHomeworkItemDTO[] = (
    homeworks as {
      id: string;
      title: string;
      description: string | null;
      deadline: Date | null;
      createdAt: Date;
      _count: { tasks: number };
      submissions: { status: string; grade: string | null }[];
    }[]
  ).map((hw) => {
    const submission = hw.submissions[0];
    const status: StudentHomeworkStatus =
      submission === undefined ? 'NONE' : (submission.status as StudentHomeworkStatus);

    return {
      id: hw.id,
      title: hw.title,
      description: hw.description,
      deadline: hw.deadline ? hw.deadline.toISOString() : null,
      createdAt: hw.createdAt.toISOString(),
      tasksCount: hw._count.tasks,
      teacherName: studentProfile.teacher!.fullName,
      status,
      grade: status === 'CHECKED' ? submission?.grade ?? null : null,
    };
  });

  return {
    success: true,
    data: { teacherName: studentProfile.teacher.fullName, homeworks: items },
  };
}

// ─────────────── Решение ДЗ учеником ───────────────

/** Возвращает профиль текущего ученика вместе с привязанным учителем (или null). */
async function getStudentWithTeacher() {
  const guard = await requireStudentProfileId();
  if ('error' in guard) return null;
  const profile = await db.studentProfile.findUnique({
    where: { id: guard.studentProfileId },
    include: { teacher: { select: { id: true, fullName: true } } },
  });
  return profile;
}

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4 МБ (serverActions bodySizeLimit = 5mb)

/**
 * ДЗ для страницы решения: задачи + текущая Submission ученика (если есть).
 * Проверка доступа: ДЗ должно принадлежать учителю, к которому привязан ученик.
 */
export async function getHomeworkForStudentAction(
  homeworkId: string
): Promise<ActionResult<StudentHomeworkSolveDTO>> {
  const student = await getStudentWithTeacher();
  if (!student) return { error: 'Доступ только для учеников' };
  if (!student.teacher) {
    return { error: 'Учитель не привязан — домашних заданий нет' };
  }

  const homework = await db.homework.findFirst({
    where: { id: homeworkId, teacherId: student.teacher.id }, // ДЗ именно этого учителя
    include: {
      tasks: { orderBy: { order: 'asc' } },
      submissions: {
        where: { studentId: student.id },
        include: { answers: true },
        take: 1,
      },
    },
  });

  if (!homework) {
    return { error: 'Домашнее задание не найдено или вам недоступно' };
  }

  const submission = homework.submissions[0];

  const data: StudentHomeworkSolveDTO = {
    id: homework.id,
    title: homework.title,
    description: homework.description,
    deadline: homework.deadline ? homework.deadline.toISOString() : null,
    teacherName: student.teacher.fullName,
    tasks: homework.tasks.map((t) => ({
      id: t.id,
      order: t.order,
      content: t.content,
      correctAnswer: t.correctAnswer,
      requirePhoto: t.requirePhoto,
    })),
    submission: submission
      ? (() => {
          const autoChecked = homework.tasks.filter((t) => t.correctAnswer !== null).length;
          const correctCount = submission.answers.filter((a) => a.isCorrect === true).length;
          const wasSubmitted = submission.status !== 'DRAFT';
          return {
            id: submission.id,
            status: submission.status as 'DRAFT' | 'SUBMITTED' | 'CHECKED',
            submittedAt: submission.submittedAt ? submission.submittedAt.toISOString() : null,
            grade: submission.grade,
            comment: submission.comment,
            autoCheck: wasSubmitted
              ? { correct: correctCount, autoChecked, totalTasks: homework.tasks.length }
              : null,
            answers: submission.answers.map((a) => ({
              taskId: a.taskId,
              textAnswer: a.textAnswer,
              photoUrl: a.photoUrl,
              isCorrect: a.isCorrect,
            })),
          };
        })()
      : null,
  };

  return { success: true, data };
}

/**
 * Сохраняет/обновляет один ответ ученика (textAnswer и/или photoUrl).
 * Если Submission ещё нет — создаёт её со статусом DRAFT (ученик «начал решать»).
 * Если ДЗ уже отправлено/проверено — сохранение запрещено.
 */
export async function saveAnswerAction(
  submissionId: string | null,
  taskId: string,
  data: unknown
): Promise<ActionResult<{ submissionId: string }>> {
  const student = await getStudentWithTeacher();
  if (!student) return { error: 'Доступ только для учеников' };

  const parsed = saveAnswerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Ошибка валидации ответа' };
  }

  // Задача должна относиться к ДЗ текущего учителя ученика
  const task = await db.task.findFirst({
    where: { id: taskId, homework: { teacherId: student.teacherId } },
    select: { id: true, homeworkId: true },
  });
  if (!task) return { error: 'Задача не найдена или вам недоступна' };

  const { textAnswer, photoUrl } = parsed.data;

  try {
    let submission;

    if (submissionId) {
      submission = await db.submission.findFirst({
        where: { id: submissionId, studentId: student.id, homeworkId: task.homeworkId },
      });
      if (!submission) return { error: 'Черновик решения не найден' };
      if (submission.status !== 'DRAFT') {
        return { error: 'ДЗ уже отправлено — изменять ответы нельзя' };
      }
    } else {
      // upsert по @@unique([studentId, homeworkId]) — защита от гонки автосейвов
      submission = await db.submission.upsert({
        where: { studentId_homeworkId: { studentId: student.id, homeworkId: task.homeworkId } },
        create: { studentId: student.id, homeworkId: task.homeworkId, status: 'DRAFT' },
        update: {},
      });
      if (submission.status !== 'DRAFT') {
        return { error: 'ДЗ уже отправлено — изменять ответы нельзя' };
      }
    }

    await db.answer.upsert({
      where: { submissionId_taskId: { submissionId: submission.id, taskId: task.id } },
      create: {
        submissionId: submission.id,
        taskId: task.id,
        textAnswer: textAnswer ?? null,
        photoUrl: photoUrl ?? null,
      },
      update: {
        ...(textAnswer !== undefined && textAnswer !== null ? { textAnswer } : {}),
        ...(photoUrl !== undefined ? { photoUrl: photoUrl ?? null } : {}),
      },
    });

    revalidatePath('/student/homework');
    return { success: true, data: { submissionId: submission.id } };
  } catch (err) {
    console.error('saveAnswerAction error:', err);
    return { error: 'Не удалось сохранить ответ. Попробуйте ещё раз.' };
  }
}

/**
 * Отправка ДЗ (ПРОМТ-14):
 *  - DRAFT -> SUBMITTED, фиксируется submittedAt;
 *  - автопроверка: для каждого ответа, у задачи которого есть correctAnswer,
 *    сравниваем textAnswer с эталоном (нормализация: trim, lowercase,
 *    игнорирование пробелов вокруг операторов) и записываем isCorrect;
 *  - возвращает результат: сколько верно / сколько всего (auto + manual).
 */
export async function submitHomeworkAction(
  submissionId: string
): Promise<
  ActionResult<{
    submittedAt: string;
    autoChecked: number;
    correct: number;
    totalTasks: number;
  }>
> {
  const student = await getStudentWithTeacher();
  if (!student) return { error: 'Доступ только для учеников' };

  const submission = await db.submission.findFirst({
    where: { id: submissionId, studentId: student.id },
  });
  if (!submission) return { error: 'Решение не найдено' };
  if (submission.status === 'SUBMITTED' || submission.status === 'CHECKED') {
    return { error: 'ДЗ уже отправлено' };
  }

  try {
    // Аккуратно доводим автосейвы до конца: берём все сохранённые ответы
    const answers = await db.answer.findMany({
      where: { submissionId: submission.id },
      include: { task: { select: { id: true, correctAnswer: true } } },
    });

    const graded = answers.filter((a) => a.task.correctAnswer !== null);
    let correct = 0;

    // Автопроверка каждого ответа с эталоном (транзакция — атомарно со статусом)
    const submittedAt = await db.$transaction(async (tx) => {
      for (const answer of graded) {
        const isCorrect = checkAnswer(answer.textAnswer, answer.task.correctAnswer ?? '');
        if (isCorrect) correct += 1;
        await tx.answer.update({ where: { id: answer.id }, data: { isCorrect } });
      }
      const now = new Date();
      await tx.submission.update({
        where: { id: submission.id },
        data: { status: 'SUBMITTED', submittedAt: now },
      });
      return now;
    });

    const totalTasks = await db.task.count({ where: { homeworkId: submission.homeworkId } });

    revalidatePath('/student/homework');
    revalidatePath(`/student/homework/${submission.homeworkId}`);
    return {
      success: true,
      data: {
        submittedAt: submittedAt.toISOString(),
        autoChecked: graded.length,
        correct,
        totalTasks,
      },
    };
  } catch (err) {
    console.error('submitHomeworkAction error:', err);
    return { error: 'Не удалось отправить ДЗ. Проверьте соединение и попробуйте ещё раз.' };
  }
}

// ─────────────── Проверка ДЗ учителем (ПРОМТ-14, часть B) ───────────────

/**
 * ДЗ учителя для страницы проверки: информация о ДЗ, задачи и список
 * всех отправленных/проверенных решений учеников с результатом автопроверки.
 */
export async function getHomeworkForReviewAction(
  homeworkId: string
): Promise<ActionResult<TeacherHomeworkReviewDTO>> {
  const guard = await requireTeacherProfileId();
  if ('error' in guard) return { error: guard.error };

  const homework = await db.homework.findFirst({
    where: { id: homeworkId, teacherId: guard.profileId }, // только своё ДЗ
    include: {
      tasks: { orderBy: { order: 'asc' } },
      submissions: {
        where: { status: { in: ['SUBMITTED', 'CHECKED'] } },
        include: {
          student: { select: { fullName: true } },
          answers: { select: { isCorrect: true, taskId: true } },
        },
        orderBy: { submittedAt: 'asc' },
      },
    },
  });

  if (!homework) {
    return { error: 'Домашнее задание не найдено или вам недоступно' };
  }

  const totalTasks = homework.tasks.length;

  return {
    success: true,
    data: {
      id: homework.id,
      title: homework.title,
      description: homework.description,
      deadline: homework.deadline ? homework.deadline.toISOString() : null,
      createdAt: homework.createdAt.toISOString(),
      totalTasks,
      tasks: homework.tasks.map((t) => ({
        id: t.id,
        order: t.order,
        content: t.content,
        correctAnswer: t.correctAnswer,
        requirePhoto: t.requirePhoto,
      })),
      submissions: homework.submissions.map((s) => {
        const checkedCount = s.answers.filter((a) => a.isCorrect !== null).length;
        const correctCount = s.answers.filter((a) => a.isCorrect === true).length;
        return {
          id: s.id,
          studentId: s.studentId,
          studentName: s.student.fullName,
          status: s.status as 'SUBMITTED' | 'CHECKED',
          submittedAt: s.submittedAt ? s.submittedAt.toISOString() : null,
          grade: s.grade,
          correctCount,
          checkedCount,
          totalTasks,
        };
      }),
    },
  };
}

/**
 * Полное решение одного ученика для модалки проверки:
 * все ответы с текстом/фото/результатом автопроверки + условия задач.
 */
export async function getSubmissionReviewAction(
  submissionId: string
): Promise<ActionResult<SubmissionReviewDTO>> {
  const guard = await requireTeacherProfileId();
  if ('error' in guard) return { error: guard.error };

  const submission = await db.submission.findFirst({
    where: { id: submissionId, homework: { teacherId: guard.profileId } },
    include: {
      student: { select: { fullName: true, grade: true } },
      homework: { select: { title: true } },
      answers: {
        include: { task: { select: { order: true, content: true, correctAnswer: true, requirePhoto: true } } },
        orderBy: { task: { order: 'asc' } },
      },
    },
  });

  if (!submission) {
    return { error: 'Решение не найдено или вам недоступно' };
  }

  return {
    success: true,
    data: {
      id: submission.id,
      status: submission.status as 'SUBMITTED' | 'CHECKED',
      submittedAt: submission.submittedAt ? submission.submittedAt.toISOString() : null,
      grade: submission.grade,
      comment: submission.comment,
      studentName: submission.student.fullName,
      studentGradeClass: submission.student.grade,
      homeworkTitle: submission.homework.title,
      answers: submission.answers.map((a) => ({
        taskId: a.taskId,
        taskOrder: a.task.order,
        taskContent: a.task.content,
        correctAnswer: a.task.correctAnswer,
        requirePhoto: a.task.requirePhoto,
        textAnswer: a.textAnswer,
        photoUrl: a.photoUrl,
        isCorrect: a.isCorrect,
      })),
    },
  };
}

/**
 * Выставление оценки учителем: SUBMITTED -> CHECKED, сохраняет grade и комментарий.
 * Повторная проверка (изменение оценки) также разрешена — статус остаётся CHECKED.
 */
export async function gradeSubmissionAction(
  submissionId: string,
  data: unknown
): Promise<ActionResult<{ grade: string }>> {
  const guard = await requireTeacherProfileId();
  if ('error' in guard) return { error: guard.error };

  const parsed = gradeSubmissionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Ошибка валидации оценки' };
  }

  const submission = await db.submission.findFirst({
    where: { id: submissionId, homework: { teacherId: guard.profileId } },
  });
  if (!submission) return { error: 'Решение не найдено или вам недоступно' };
  if (submission.status === 'DRAFT') {
    return { error: 'Ученик ещё не отправил работу — проверять нечего' };
  }

  try {
    await db.submission.update({
      where: { id: submission.id },
      data: { status: 'CHECKED', grade: parsed.data.grade, comment: parsed.data.comment ?? null },
    });
    revalidatePath(`/teacher/homework/${submission.homeworkId}`);
    revalidatePath('/teacher/homework');
    revalidatePath('/student/homework');
    return { success: true, data: { grade: parsed.data.grade } };
  } catch (err) {
    console.error('gradeSubmissionAction error:', err);
    return { error: 'Не удалось сохранить оценку. Попробуйте ещё раз.' };
  }
}

/**
 * Загрузка фото-ответа: сохраняет файл локально в public/uploads/,
 * возвращает публичный URL (/uploads/<имя>). Без S3 — для простоты.
 */
export async function uploadPhotoAction(file: File): Promise<ActionResult<{ url: string }>> {
  const session = await getSessionUser();
  if (!session) return { error: 'Не авторизован' };

  if (file.size > MAX_PHOTO_BYTES) {
    return { error: 'Фото слишком большое (максимум 4 МБ)' };
  }
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    return { error: 'Можно загружать только изображения: PNG, JPEG, WEBP, GIF' };
  }

  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const fileName = `${Date.now()}-${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, fileName), buffer);

    return { success: true, data: { url: `/uploads/${fileName}` } };
  } catch (err) {
    console.error('uploadPhotoAction error:', err);
    return { error: 'Не удалось загрузить фото. Попробуйте ещё раз.' };
  }
}
