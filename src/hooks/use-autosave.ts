// src/hooks/use-autosave.ts
// Кастомный хук автосохранения: при изменении value ждёт паузу delay (мс)
// и вызывает onSave. Возвращает статус для индикатора «Сохранение.../Сохранено».
// Сохранение асинхронное и не блокирует интерфейс.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutosaveOptions {
  /** Значение, за которым следим (текст ответа ученика). */
  value: string;
  /** Функция сохранения (например, обёртка над saveAnswerAction). */
  onSave: (value: string) => Promise<void>;
  /** Пауза перед сохранением, мс. По умолчанию 1500. */
  delay?: number;
}

/**
 * useAutosave — debounce-автосохранение одного поля.
 *
 * - При первом рендере НЕ сохраняет (нет смысла писать в БД то, что уже сохранено).
 * - При быстром наборе сохраняет только после паузы `delay`.
 * - При ошибке сети status = 'error' — компонент может показать toast и кнопку повтора
 *   (retry), либо пользователь просто продолжит печатать и сохранение повторится.
 */
export function useAutosave({ value, onSave, delay = 1500 }: UseAutosaveOptions) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');

  // Реф на актуальную функцию сохранения, чтобы не пересоздавать таймер
  // при каждом изменении колбэка.
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const isFirstRun = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedValue = useRef<string>(value); // значение на момент монтирования уже в БД

  const runSave = useCallback(async (nextValue: string) => {
    setStatus('saving');
    try {
      await onSaveRef.current(nextValue);
      lastSavedValue.current = nextValue;
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    // Пропускаем начальный рендер — ничего не менялось
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    // Значение вернулось к последнему сохранённому — сохранять нечего
    if (value === lastSavedValue.current) {
      setStatus('idle');
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void runSave(value);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay, runSave]);

  // Принудительный повтор последнего сохранения (для кнопки «Повторить» в тосте)
  const retry = useCallback(() => {
    void runSave(value);
  }, [runSave, value]);

  // Немедленное сохранение (например, перед отправкой ДЗ)
  const flush = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value !== lastSavedValue.current) {
      await runSave(value);
    }
  }, [runSave, value]);

  return { status, retry, flush } as const;
}
