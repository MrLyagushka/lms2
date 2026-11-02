// src/components/homework/student-homework-list.tsx
// Список ДЗ ученика с табами-фильтрами: «Все», «Активные» (не отправлено), «Завершённые».
// На мобильных — вертикальный список, на десктопе — сетка карточек.

'use client';

import { useState } from 'react';
import { ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { HomeworkCard } from '@/components/homework/homework-card';
import type { StudentHomeworkItemDTO } from '@/types';

type Tab = 'all' | 'active' | 'done';

const tabs: { id: Tab; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'active', label: 'Активные' },
  { id: 'done', label: 'Завершённые' },
];

function filterHomeworks(homeworks: StudentHomeworkItemDTO[], tab: Tab): StudentHomeworkItemDTO[] {
  switch (tab) {
    case 'active':
      // Не отправлено: решения нет или черновик
      return homeworks.filter((hw) => hw.status === 'NONE' || hw.status === 'DRAFT');
    case 'done':
      // Отправлено или проверено
      return homeworks.filter((hw) => hw.status === 'SUBMITTED' || hw.status === 'CHECKED');
    default:
      return homeworks;
  }
}

export function StudentHomeworkList({ homeworks }: { homeworks: StudentHomeworkItemDTO[] }) {
  const [tab, setTab] = useState<Tab>('all');
  const filtered = filterHomeworks(homeworks, tab);

  return (
    <div className="space-y-4">
      {/* Табы-фильтры */}
      <div
        role="tablist"
        aria-label="Фильтр домашних заданий"
        className="inline-flex rounded-lg border border-border bg-muted p-1"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Пустое состояние */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-foreground">
              {homeworks.length === 0
                ? 'У вас пока нет домашних заданий'
                : tab === 'active'
                  ? 'Нет активных заданий — всё отправлено 🎉'
                  : 'Нет завершённых заданий'}
            </p>
            {homeworks.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Когда ваш учитель создаст ДЗ, оно появится здесь.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Адаптивная раскладка: список на мобильных, grid на десктопе */
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((hw) => (
            <li key={hw.id}>
              <HomeworkCard homework={hw} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
