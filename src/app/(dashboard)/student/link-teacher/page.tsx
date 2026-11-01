import { db } from '@/lib/db';
import { getServerUserOrThrow } from '@/lib/auth';
import { LinkTeacherForm } from '@/components/forms/link-teacher-form';
import { UnlinkTeacherButton } from '@/components/profile/unlink-teacher-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Привязка к учителю',
};

export default async function LinkTeacherPage() {
  const user = await getServerUserOrThrow();

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: user.id },
    include: { teacher: true },
  });

  if (!studentProfile) {
    return (
      <div className="mx-auto max-w-xl">
        <p className="text-sm text-destructive">Профиль ученика не найден.</p>
      </div>
    );
  }

  // Случай A: учитель уже привязан — показываем карточку учителя + кнопку отвязки
  if (studentProfile.teacher) {
    const teacher = studentProfile.teacher;
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Ваш учитель</h1>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{teacher.fullName}</CardTitle>
              <Badge>Привязан</Badge>
            </div>
            <CardDescription>
              {teacher.subject ? `Предмет: ${teacher.subject}` : 'Предмет не указан'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teacher.bio && <p className="text-sm text-muted-foreground">{teacher.bio}</p>}
            <p className="text-sm text-muted-foreground">
              Код учителя:{' '}
              <span className="font-mono font-semibold text-foreground">{teacher.teacherCode}</span>
            </p>
            <UnlinkTeacherButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Случай B: учителя нет — форма ввода кода
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Привязка к учителю</h1>

      <Card>
        <CardHeader>
          <CardTitle>Введите код учителя</CardTitle>
          <CardDescription>
            Чтобы получать домашние задания, привяжите свой аккаунт к учителю по его
            уникальному 6-символьному коду.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LinkTeacherForm />
        </CardContent>
      </Card>
    </div>
  );
}
