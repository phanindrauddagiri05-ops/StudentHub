'use client';

import { useState, useCallback } from 'react';
import type { PdfOperationState } from '@/types';

interface UsePdfOperationOptions<T> {
  operation: (...args: unknown[]) => Promise<T>;
}

interface UsePdfOperationResult<T> {
  state: PdfOperationState;
  result: T | null;
  error: string | null;
  progress: number;
  execute: (...args: unknown[]) => Promise<void>;
  reset: () => void;
  setProgress: (p: number) => void;
}

/**
 * Generic hook for managing PDF operation state machine:
 * idle → processing → success | error
 */
export function usePdfOperation<T>(
  options: UsePdfOperationOptions<T>
): UsePdfOperationResult<T> {
  const [state, setState] = useState<PdfOperationState>('idle');
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const execute = useCallback(
    async (...args: unknown[]) => {
      setState('processing');
      setError(null);
      setResult(null);
      setProgress(0);

      try {
        const output = await options.operation(...args);
        setResult(output);
        setState('success');
        setProgress(100);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "We couldn't process this file. Please try again.";
        setError(message);
        setState('error');
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return { state, result, error, progress, execute, reset, setProgress };
}
