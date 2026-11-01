// src/server/homework.actions.ts
// Server Actions для домашнего задания: создание (транзакция Homework + Task),
// список ДЗ учителя, получение одного ДЗ с задачами, удаление.

'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { createHomeworkSchema } from '@/validators/homework.validator';
import type { ActionResult, HomeworkItemDTO, HomeworkDetailDTO } from '@/types';

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
