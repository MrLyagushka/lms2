// src/app/(dashboard)/teacher/students/page.tsx
// Страница "Мои ученики" — Server Component.
// Получает список привязанных учеников на сервере (только свои),
// передаёт данные в клиентскую таблицу с поиском/редактированием.

import { db } from '@/lib/db';
import { getServerUserOrThrow } from '@/lib/auth';
import { StudentsTable } from '@/components/teacher/students-table';
import type { StudentListItemDTO } from '@/types';

export const metadata = {
  title: 'Мои ученики',
  description: 'Список учеников, привязанных к вам',
};

export default async function TeacherStudentsPage() {
  const user = await getServerUserOrThrow();

  // Гарантируем, что это учитель
  if (user.role !== 'TEACHER') {
    return (
      <p className="text-sm text-muted-foreground">Страница доступна только учителям.</p>
    );
  }

  const teacherProfile = await db.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, teacherCode: true },
  });

  if (!teacherProfile) {
    return <p className="text-sm text-destructive">Профиль учителя не найден.</p>;
  }

  // Учитель видит ТОЛЬКО своих учеников — фильтр по teacherId на сервере.
  const students = await db.studentProfile.findMany({
    where: { teacherId: teacherProfile.id },
    include: { user: { select: { email: true } } },
    orderBy: { fullName: 'asc' },
  });

  const studentDTOs: StudentListItemDTO[] = students.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    email: s.user.email,
    grade: s.grade,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Мои ученики</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Всего учеников: {studentDTOs.length} · Ваш код для привязки:{' '}
          <span className="font-mono font-semibold text-foreground">
            {teacherProfile.teacherCode}
          </span>
        </p>
      </div>

      {studentDTOs.length === 0 ? (
        // Пустое состояние
        <div className="rounded-lg border border-dashed border-border bg-muted/40 p-10 text-center">
          <p className="text-base font-medium text-foreground">У вас пока нет учеников</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Передайте им ваш код учителя{' '}
            <span className="font-mono font-semibold text-foreground">
              {teacherProfile.teacherCode}
            </span>{' '}
            — ученик сможет привязаться на странице своего профиля.
          </p>
        </div>
      ) : (
        <StudentsTable students={studentDTOs} />
      )}
    </div>
  );
}
