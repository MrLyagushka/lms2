// src/app/(dashboard)/teacher/error.tsx
'use client';

import { ErrorFallback } from '@/components/ui/error-fallback';

export default function SegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} homeHref="/teacher/homework" />;
}
