import { useEffect, useState } from 'react';

const MAX_ERRORS = 8;

const toRawError = (...parts: unknown[]) =>
  parts
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part instanceof Error) return part.stack ?? part.message;
      try {
        return JSON.stringify(part);
      } catch {
        return String(part);
      }
    })
    .join(' ')
    .trim();

export function MobileConsole() {
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const previousConsoleError = console.error;

    const pushError = (message: string) => {
      if (!message) return;
      setErrors((previous) => [message, ...previous].slice(0, MAX_ERRORS));
    };

    const onError = (
      eventMessage: Event | string,
      source?: string,
      line?: number,
      column?: number,
      error?: Error
    ) => {
      const primaryMessage = typeof eventMessage === 'string' ? eventMessage : (eventMessage as ErrorEvent).message;
      pushError(toRawError(primaryMessage, source ? `@${source}:${line ?? 0}:${column ?? 0}` : '', error ?? ''));
      return false;
    };

    window.onerror = onError;
    console.error = (...args: unknown[]) => {
      pushError(toRawError(...args));
      previousConsoleError(...args);
    };

    return () => {
      window.onerror = null;
      console.error = previousConsoleError;
    };
  }, []);

  if (errors.length === 0) return null;

  return (
    <aside className="mobile-console" role="status" aria-live="assertive">
      <strong>Runtime Errors</strong>
      <ul>
        {errors.map((error, index) => (
          <li key={`${error}-${index}`}>{error}</li>
        ))}
      </ul>
    </aside>
  );
}
