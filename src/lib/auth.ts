// src/lib/auth.ts
// Сессионная аутентификация на подписанных JWT (jose) в httpOnly-cookie.
// Пароли — bcryptjs. Роли: 'TEACHER' | 'STUDENT' (см. prisma/schema.prisma).

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@/types';

const AUTH_COOKIE = 'lp_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 дней

export interface SessionUser {
  /** id пользователя (User.id) — доступен и как userId, и как id */
  userId: string;
  id: string;
  role: UserRole;
  email: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'change-me-to-a-long-random-secret') {
    throw new Error('Не задан JWT_SECRET в .env — сессии небезопасны. Скопируйте .env.example в .env и задайте секрет.');
  }
  return new TextEncoder().encode(secret);
}

// ─────────────── Пароли ───────────────

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─────────────── Сессии (cookie + JWT) ───────────────

/** Подписывает JWT и устанавливает httpOnly-cookie. Вызывать из Server Action/route handler. */
export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ role: user.role, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());

  cookies().set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });
}

/** Удаляет cookie сессии. */
export function destroySession(): void {
  cookies().delete(AUTH_COOKIE);
}

/** Читает и проверяет cookie-сессию. Возвращает null, если пользователь не авторизован. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: undefined,
    });
    const role = payload.role;
    if (role !== 'TEACHER' && role !== 'STUDENT') return null;
    if (!payload.sub) return null; // sub (userId) обязателен для валидной сессии
    return {
      userId: payload.sub,
      id: payload.sub,
      role,
      email: typeof payload.email === 'string' ? payload.email : '',
    };
  } catch {
    return null;
  }
}

/** То же, что getSessionUser, но бросает ошибку (для Server Components, которым нужен профиль). */
export async function getServerUserOrThrow(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) {
    throw new Error('Требуется авторизация');
  }
  return session;
}

/**
 * Guard для страниц дашборда: без сессии — редирект на /login.
 * При несовпадении роли — редирект в соответствующий дашборд.
 */
export async function requireSessionOrRedirect(expectedRole?: UserRole, nextPath = '/'): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (expectedRole && session.role !== expectedRole) {
    redirect(session.role === 'TEACHER' ? '/teacher/homework' : '/student/homework');
  }
  return session;
}
