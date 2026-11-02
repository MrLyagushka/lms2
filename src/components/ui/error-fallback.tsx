// src/components/ui/error-fallback.tsx
// Единая граница ошибок для сегментов (используется из error.tsx — поэтому 'use client').

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';

export function ErrorFallback({
  error,
  reset,
  homeHref = '/',
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
}) {
  useEffect(() => {
    console.error('Unhandled UI error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-12 text-center">
      <TriangleAlert className="h-10 w-10 text-destructive" aria-hidden />
      <h2 className="text-lg font-bold">Что-то пошло не так</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Произошла непредвиденная ошибка. Попробуйте повторить действие или вернуться в раздел.
        {error.digest ? ` (код ошибки: ${error.digest})` : ''}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Повторить
        </button>
        <Link
          href={homeHref}
          className="inline-flex h-10 items-center justify-center rounded-md border border-input px-4 text-sm font-medium hover:bg-muted"
        >
          Вернуться
        </Link>
      </div>
    </div>
  );
}
