// src/app/not-found.tsx
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <FileQuestion className="h-10 w-10 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-bold">Страница не найдена</h1>
      <p className="text-sm text-muted-foreground">
        Возможно, ссылка устарела или страница была удалена.
      </p>
      <Link
        href="/"
        className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Вернуться на главную
      </Link>
    </main>
  );
}
