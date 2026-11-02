// src/app/error.tsx
// Граница ошибок для корневой сегмента (страницы /, /login, /register и fallback для всего app).

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled UI error:', error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <TriangleAlert className="h-10 w-10 text-destructive" aria-hidden />
      <h1 className="text-xl font-bold">Что-то пошло не так</h1>
      <p className="text-sm text-muted-foreground">
        Произошла непредвиденная ошибка. Попробуйте повторить действие или вернуться на главную.
        {error.digest ? ` (код ошибки: ${error.digest})` : ''}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Повторить
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md border border-input px-4 text-sm font-medium hover:bg-muted"
        >
          На главную
        </Link>
      </div>
    </main>
  );
}
