// src/app/(dashboard)/layout.tsx
// Общий каркас дашборда: шапка с навигацией по роли + выход.

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { requireSessionOrRedirect } from '@/lib/auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LogoutButton } from '@/components/auth/logout-button';

const TEACHER_NAV = [
  { href: '/teacher/homework', label: 'Домашние задания' },
  { href: '/teacher/homework/new', label: 'Новое ДЗ' },
  { href: '/teacher/students', label: 'Мои ученики' },
];

const STUDENT_NAV = [
  { href: '/student/homework', label: 'Домашние задания' },
  { href: '/student/link-teacher', label: 'Привязка учителя' },
  { href: '/student/profile', label: 'Профиль' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSessionOrRedirect();
  const isTeacher = session.role === 'TEACHER';
  const nav = isTeacher ? TEACHER_NAV : STUDENT_NAV;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-primary">
              <BookOpen className="h-5 w-5" aria-hidden />
              <span className="text-sm sm:text-base">Learning Platform</span>
            </Link>
            <div className="flex items-center gap-1 sm:hidden">
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
          <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1 sm:pb-0" aria-label="Основная навигация">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-1 sm:flex">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      {/* main задаёт каждая страница (свои meta, контейнер) — здесь только content */}
      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
