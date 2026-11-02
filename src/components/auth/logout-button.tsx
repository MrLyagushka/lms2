// src/components/auth/logout-button.tsx
'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { logoutAction } from '@/server/auth.actions';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await logoutAction();
        router.push('/login');
      }}
    >
      <LogOut className="h-4 w-4" aria-hidden />
      Выйти
    </Button>
  );
}
