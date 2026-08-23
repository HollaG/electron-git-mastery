import { useCallback, useState } from "react";

/**
 * Persists a JSON-serialisable value under `key`.
 *
 * The stored value is read synchronously while initialising state rather than
 * from an effect, so a persisted value is already applied on the first paint —
 * otherwise gates such as the onboarding flag flash their default on launch.
 */
export function useLocalStorage<T>({
  key,
  defaultValue,
}: {
  key: string;
  defaultValue: T;
}) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? defaultValue : (JSON.parse(raw) as T);
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage can be unavailable or full; the in-memory value still applies.
      }
    },
    [key],
  );

  return [value, set] as const;
}
