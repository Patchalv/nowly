'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook for managing state synced with localStorage
 * Handles SSR safely by only accessing localStorage in the browser
 *
 * @param key - localStorage key
 * @param initialValue - Default value if no stored value exists
 * @returns [storedValue, setValue] - Tuple similar to useState
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error loading localStorage key "${key}":`, error);
    } finally {
      setIsInitialized(true);
    }
  }, [key]);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error saving localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // During SSR or before initialization, return initial value to prevent hydration mismatch
  return [isInitialized ? storedValue : initialValue, setValue];
}
