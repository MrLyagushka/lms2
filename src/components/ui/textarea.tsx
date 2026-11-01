// src/components/ui/textarea.tsx
import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
