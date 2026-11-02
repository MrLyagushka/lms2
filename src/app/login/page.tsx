// src/app/login/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { LoginForm } from '@/components/auth/auth-forms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Вход',
  description: 'Вход в Learning Platform',
};

export default async function LoginPage() {
  const session = await getSessionUser();
  if (session) {
    redirect(session.role === 'TEACHER' ? '/teacher/homework' : '/student/homework');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-12">
      <Link href="/" className="flex items-center justify-center gap-2 text-primary">
        <BookOpen className="h-7 w-7" aria-hidden />
        <span className="text-xl font-bold">Learning Platform</span>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Вход в аккаунт</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
