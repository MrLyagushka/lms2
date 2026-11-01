'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { unlinkTeacherAction } from '@/server/student.actions';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function UnlinkTeacherButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlink = async () => {
    setError(null);
    setIsPending(true);
    try {
      const result = await unlinkTeacherAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError('Сетевая ошибка. Попробуйте ещё раз.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button variant="destructive" onClick={handleUnlink} disabled={isPending}>
        {isPending ? <Spinner className="h-4 w-4" /> : 'Отвязаться'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
