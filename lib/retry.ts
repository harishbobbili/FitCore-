"use client";

import { useCallback } from "react";

export interface RetryConfig {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export function useRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: RetryConfig = {}
) {
  const { maxRetries = 3, delayMs = 1000, backoffMultiplier = 2, onRetry } = config;

  const executeWithRetry = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      let lastError: Error;
      let currentDelay = delayMs;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn(...args);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          if (attempt === maxRetries) {
            throw lastError;
          }

          if (onRetry) {
            onRetry(attempt + 1, lastError);
          }

          await new Promise((resolve) => setTimeout(resolve, currentDelay));
          currentDelay *= backoffMultiplier;
        }
      }

      throw lastError!;
    },
    [fn, maxRetries, delayMs, backoffMultiplier, onRetry]
  );

  return executeWithRetry;
}

export function withRetry<T>(
  promise: Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoffMultiplier = 2 } = config;

  return new Promise((resolve, reject) => {
    let attempt = 0;
    let currentDelay = delayMs;

    const attemptExecution = () => {
      promise
        .then(resolve)
        .catch((error) => {
          if (attempt >= maxRetries) {
            reject(error);
            return;
          }
          attempt++;
          setTimeout(attemptExecution, currentDelay);
          currentDelay *= backoffMultiplier;
        });
    };

    attemptExecution();
  });
}
