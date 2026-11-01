import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { db } from '@/lib/db';
import { getServerUserOrThrow } from '@/lib/auth';

export default async function StudentProfilePage() {
  const user = await getServerUserOrThrow();

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: user.id },
    include: { teacher: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Профиль ученика</h1>

      {/* Баннер: учитель не привязан */}
      {!studentProfile?.teacher && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-foreground">Привяжите учителя</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Чтобы получать домашние задания, введите уникальный код вашего учителя.{' '}
              <Link
                href="/student/link-teacher"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Привязаться сейчас →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Остальные блоки профиля и форма редактирования — по ПРОМТ-7 */}
      {/* ... */}
    </div>
  );
}
