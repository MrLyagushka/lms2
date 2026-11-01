'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { teacherCodeSchema } from '@/validators/student.validator';

export interface LinkTeacherResult {
  error?: string;
  success?: boolean;
  teacherName?: string;
}

/**
 * Привязка текущего ученика к учителю по 6-символьному коду.
 * Код регистронезависимый: приводится к uppercase в Zod-схеме.
 */
export async function linkToTeacherAction(rawCode: string): Promise<LinkTeacherResult> {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'STUDENT') {
      return { error: 'Только ученики могут привязываться к учителю' };
    }

    const parsed = teacherCodeSchema.safeParse(rawCode);
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? 'Некорректный код учителя' };
    }

    const code = parsed.data;

    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!studentProfile) {
      return { error: 'Профиль ученика не найден' };
    }

    const teacherProfile = await db.teacherProfile.findUnique({
      where: { teacherCode: code },
    });
    if (!teacherProfile) {
      return { error: 'Учитель с таким кодом не найден' };
    }

    await db.studentProfile.update({
      where: { id: studentProfile.id },
      data: { teacherId: teacherProfile.id },
    });

    revalidatePath('/student/profile');
    revalidatePath('/student/link-teacher');

    return { success: true, teacherName: teacherProfile.fullName };
  } catch (error) {
    console.error('linkToTeacherAction error:', error);
    return { error: 'Не удалось привязаться к учителю. Попробуйте позже.' };
  }
}

/**
 * Отвязка текущего ученика от учителя.
 */
export async function unlinkTeacherAction(): Promise<LinkTeacherResult> {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'STUDENT') {
      return { error: 'Только ученики могут отвязываться от учителя' };
    }

    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!studentProfile) {
      return { error: 'Профиль ученика не найден' };
    }
    if (!studentProfile.teacherId) {
      return { error: 'Вы не привязаны ни к одному учителю' };
    }

    await db.studentProfile.update({
      where: { id: studentProfile.id },
      data: { teacherId: null },
    });

    revalidatePath('/student/profile');
    revalidatePath('/student/link-teacher');

    return { success: true };
  } catch (error) {
    console.error('unlinkTeacherAction error:', error);
    return { error: 'Не удалось отвязаться от учителя. Попробуйте позже.' };
  }
}
