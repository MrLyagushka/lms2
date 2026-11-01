'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { linkToTeacherAction } from '@/server/student.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

export function LinkTeacherForm() {
  const router = useRouter();
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const result = await linkToTeacherAction(code);
      if (result.error) {
        setError(result.error);
        return;
      }
      // Успешная привязка — редирект на профиль ученика
      router.push('/student/profile');
    } catch {
      setError('Сетевая ошибка. Попробуйте ещё раз.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="teacher-code" className="text-sm font-medium text-foreground">
          Код учителя
        </label>
        <Input
          id="teacher-code"
          name="teacherCode"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="ABC123"
          autoComplete="off"
          spellCheck={false}
          className="text-center font-mono text-lg tracking-[0.5em] uppercase"
          required
        />
        <p className="text-xs text-muted-foreground">
          6-символьный код, который вам выдал учитель. Регистр не важен.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending || code.length !== 6}>
          {isPending ? <Spinner className="h-4 w-4" /> : 'Привязаться'}
        </Button>
        <Link
          href="/student/profile"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}
