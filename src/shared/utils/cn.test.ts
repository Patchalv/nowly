import { cn } from '@/src/shared/utils/cn';
import { describe, expect, it } from 'vitest';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('px-4 py-2', 'bg-blue-500');
    expect(result).toBe('px-4 py-2 bg-blue-500');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('handles falsy values', () => {
    const result = cn('base-class', false, null, undefined, '');
    expect(result).toBe('base-class');
  });

  it('merges tailwind classes correctly (removes duplicates)', () => {
    const result = cn('px-4 py-2', 'px-8');
    expect(result).toBe('py-2 px-8');
  });
});
