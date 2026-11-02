// src/lib/utils.ts
// Утилиты: объединение классов (clsx + tailwind-merge) и форматирование дат.

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Склеивает tailwind-классы без конфликтов. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

/**
 * Форматирует дату для отображения («02 ноября 2026»).
 * Принимает Date или ISO-строку; null/undefined → «—».
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return dateFormatter.format(d);
}
