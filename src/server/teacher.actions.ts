// src/server/teacher.actions.ts
// Server Actions для кабинета учителя: список своих учеников,
// редактирование данных ученика, отвязка ученика.

'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { updateStudentByTeacherSchema } from '@/validators/teacher.validator';
import type { ActionResult, StudentListItemDTO } from '@/types';

/**
 * Возвращает актуального TeacherProfile текущего пользователя
 * или строку-ошибку.
 */
async function requireTeacherProfileId(): Promise<{ profileId: string } | { error: string }> {
  const session = await getSessionUser();
  if (!session || session.role !== 'TEACHER') {
    return { error: 'Доступ только для учителей' };
  }
  const profile = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
  if (!profile) return { error: 'Профиль учителя не найден' };
  return { profileId: profile.id };
}

/**
 * Список учеников, привязанных к текущему учителю.
 * Учитель видит ТОЛЬКО своих учеников (фильтр по teacherId на сервере).
 */
export async function getMyStudentsAction(): Promise<StudentListItemDTO[]> {
  const guard = await requireTeacherProfileId();
  if ('error' in guard) return [];

  const students = await db.studentProfile.findMany({
    where: { teacherId: guard.profileId },
    include: { user: { select: { email: true } } },
    orderBy: { fullName: 'asc' },
  });

  return students.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    email: s.user.email,
    grade: s.grade,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
  }));
}

/**
 * Учитель редактирует данные своего ученика (имя, класс, заметки).
 * Проверка принадлежности — обязательна.
 */
export async function updateStudentByTeacherAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const guard = await requireTeacherProfileId();
    if ('error' in guard) return { error: guard.error };

    const parsed = updateStudentByTeacherSchema.safeParse({
      studentId: formData.get('studentId'),
      fullName: formData.get('fullName'),
      grade: formData.get('grade') ?? null,
      notes: formData.get('notes') ?? null,
    });
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? 'Ошибка валидации' };
    }

    const { studentId, fullName, grade, notes } = parsed.data;

    // Принадлежность ученика этому учителю — проверяем на сервере.
    const student = await db.studentProfile.findFirst({
      where: { id: studentId, teacherId: guard.profileId },
    });
    if (!student) return { error: 'Ученик не найден или не привязан к вам' };

    await db.studentProfile.update({
      where: { id: studentId },
      data: { fullName, grade, notes },
    });

    revalidatePath('/teacher/students');
    return { success: true };
  } catch (error) {
    console.error('updateStudentByTeacherAction error:', error);
    return { error: 'Не удалось сохранить изменения. Попробуйте позже.' };
  }
}

/**
 * Отвязать ученика от учителя (обнуляется teacherId).
 */
export async function unlinkStudentAction(studentId: string): Promise<ActionResult> {
  try {
    const guard = await requireTeacherProfileId();
    if ('error' in guard) return { error: guard.error };

    const student = await db.studentProfile.findFirst({
      where: { id: studentId, teacherId: guard.profileId },
    });
    if (!student) return { error: 'Ученик не найден или не привязан к вам' };

    await db.studentProfile.update({
      where: { id: studentId },
      data: { teacherId: null },
    });

    revalidatePath('/teacher/students');
    revalidatePath('/student/profile');
    return { success: true };
  } catch (error) {
    console.error('unlinkStudentAction error:', error);
    return { error: 'Не удалось отвязать ученика. Попробуйте позже.' };
  }
}
