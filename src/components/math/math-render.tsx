// src/components/math/math-render.tsx
// Рендер текста задачи с LaTeX-формулами через KaTeX (ПРОМТ-11).
// Поддерживает $...$ (inline) и $$...$$ (display); остальной текст экранируется.
// katex.min.css импортируется в корневом layout. Используется и на сервере,
// и внутри клиентских компонентов (solve-homework), поэтому без 'server-only'.

import katex from 'katex';

/** Экранирует обычный текст перед вставкой в HTML. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Разбирает строку на части: обычный текст и формулы ($...$, $$...$$)
 * и возвращает HTML. Некорректный LaTeX KaTeX покажет красным (throwOnError: false).
 */
export function renderMathToHtml(content: string): string {
  const parts = content.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

  return parts
    .map((part) => {
      if (!part) return '';

      const isDisplay = part.startsWith('$$') && part.endsWith('$$') && part.length > 4;
      const isInline = !isDisplay && part.startsWith('$') && part.endsWith('$') && part.length > 2;

      if (isDisplay || isInline) {
        const formula = isDisplay ? part.slice(2, -2) : part.slice(1, -1);
        try {
          return katex.renderToString(formula, {
            displayMode: isDisplay,
            throwOnError: false,
          });
        } catch {
          return escapeHtml(part);
        }
      }

      // Обычный текст: переносы строк → <br />
      return escapeHtml(part).replace(/\n/g, '<br />');
    })
    .join('');
}

interface MathRenderProps {
  /** Текст задачи, может содержать LaTeX ($...$, $$...$$). */
  content: string;
  className?: string;
}

/**
 * Компонент рендера текста с математикой. Безопасно: весь не-LaTeX текст
 * экранируется, формульную часть генерирует KaTeX.
 */
export function MathRender({ content, className }: MathRenderProps) {
  const html = renderMathToHtml(content);
  return (
    <div
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
