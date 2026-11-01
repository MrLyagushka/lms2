// src/components/teacher/students-table.tsx
// Список учеников учителя: поиск по имени, редактирование (модалка), отвязка.
// Адаптивный: на мобильных — карточки, на десктопе — таблица.

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, UserX, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { unlinkStudentAction } from '@/server/teacher.actions';
import { EditStudentModal } from '@/components/teacher/edit-student-modal';
import type { StudentListItemDTO } from '@/types';

interface StudentsTableProps {
  students: StudentListItemDTO[];
}

export function StudentsTable({ students }: StudentsTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState<StudentListItemDTO | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [students, query]);

  const handleUnlink = async (student: StudentListItemDTO): Promise<void> => {
    const confirmed = window.confirm(
      `Отвязать ученика «${student.fullName}»? Он перестанет получать ваши домашние задания.`
    );
    if (!confirmed) return;

    setUnlinkingId(student.id);
    try {
      const result = await unlinkStudentAction(student.id);
      if (result?.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } finally {
      setUnlinkingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Поиск */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по имени или email…"
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring md:max-w-sm"
          aria-label="Поиск учеников"
        />
      </div>

      {/* Пустой результат поиска */}
      {filtered.length === 0 && students.length > 0 && (
        <p className="rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          Ничего не найдено по запросу «{query}»
        </p>
      )}

      {/* Таблица (десктоп) */}
      {filtered.length > 0 && (
        <div className="hidden overflow-hidden rounded-lg border border-border md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Класс</th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((student) => (
                <tr key={student.id} className="bg-card hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium text-foreground">{student.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{student.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{student.grade ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingStudent(student)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Редактировать
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnlink(student)}
                        disabled={unlinkingId === student.id}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2.5 py-1.5 text-xs font-medium text-destructive',
                          'hover:bg-destructive/10 disabled:opacity-60'
                        )}
                      >
                        <UserX className="h-3.5 w-3.5" />
                        {unlinkingId === student.id ? 'Отвязка…' : 'Отвязать'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Карточки (мобильные) */}
      <div className="space-y-3 md:hidden">
        {filtered.map((student) => (
          <div key={student.id} className="rounded-lg border border-border bg-card p-4">
            <p className="font-semibold text-foreground">{student.fullName}</p>
            <p className="text-sm text-muted-foreground">{student.email}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Класс: {student.grade ?? '—'} · Привязён {formatDate(student.createdAt)}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setEditingStudent(student)}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5" />
                Редактировать
              </button>
              <button
                type="button"
                onClick={() => handleUnlink(student)}
                disabled={unlinkingId === student.id}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2.5 py-1.5 text-xs font-medium text-destructive',
                  'hover:bg-destructive/10 disabled:opacity-60'
                )}
              >
                <UserX className="h-3.5 w-3.5" />
                {unlinkingId === student.id ? 'Отвязка…' : 'Отвязать'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Модалка редактирования */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          open={editingStudent !== null}
          onClose={() => setEditingStudent(null)}
        />
      )}
    </div>
  );
}
