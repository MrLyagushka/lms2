// src/server/auth.actions.ts
// Server Actions аутентификации: вход, регистрация, выход.
// Сессии — подписанный JWT в httpOnly-cookie (см. src/lib/auth.ts).

'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createSession, destroySession } from '@/lib/auth';
import { loginSchema, registerSchema } from '@/validators/auth.validator';
import type { ActionResult, UserRole } from '@/types';

const SALT_ROUNDS = 10;

/** User.role хранится в БД как String — сужаем тип к UserRole на границе сессии. */
function asRole(role: string): UserRole {
  return role === 'TEACHER' ? 'TEACHER' : 'STUDENT';
}

function homeForRole(role: string): string {
  return role === 'TEACHER' ? '/teacher/homework' : '/student/homework';
}

/** Вход по e-mail/паролю. При успехе ставит cookie и возвращает URL дашборда. */
export async function loginAction(
  data: unknown
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Некорректные данные' };
  }
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return { error: 'Неверный e-mail или пароль' };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: 'Неверный e-mail или пароль' };

  await createSession({ userId: user.id, id: user.id, role: asRole(user.role), email: user.email });
  revalidatePath('/', 'layout');
  return { success: true, data: { redirectTo: homeForRole(user.role) } };
}

/** Регистрация учителя или ученика + автоматический вход. */
export async function registerAction(
  data: unknown
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Ошибка валидации' };
  }
  const { fullName, email, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return { error: 'Пользователь с таким e-mail уже зарегистрирован' };

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { email: normalizedEmail, passwordHash, role },
      });
      if (role === 'TEACHER') {
        // Уникальный 6-символьный код для привязки учеников
        let code = '';
        for (let attempt = 0; attempt < 5; attempt++) {
          code = Array.from({ length: 6 }, () =>
            'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.charAt(Math.floor(Math.random() * 32))
          ).join('');
          const clash = await tx.teacherProfile.findUnique({ where: { teacherCode: code } });
          if (!clash) break;
        }
        await tx.teacherProfile.create({
          data: { userId: created.id, fullName, teacherCode: code },
        });
      } else {
        await tx.studentProfile.create({ data: { userId: created.id, fullName } });
      }
      return created;
    });

    await createSession({ userId: user.id, id: user.id, role: asRole(user.role), email: user.email });
    revalidatePath('/', 'layout');
    return { success: true, data: { redirectTo: homeForRole(user.role) } };
  } catch (err) {
    console.error('registerAction error:', err);
    return { error: 'Не удалось создать аккаунт. Попробуйте ещё раз.' };
  }
}

/** Выход: удаляет cookie и редиректит на /login. */
export async function logoutAction(): Promise<void> {
  destroySession();
  revalidatePath('/', 'layout');
  redirect('/login');
}
