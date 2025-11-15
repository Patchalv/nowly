import { describe, expect, it } from 'vitest';
import { createCategorySchema } from './category.schema';

describe('category schema', () => {
  it('should validate a valid category', () => {
    const category = {
      name: 'Test Category',
      color: '#000000',
      icon: 'Star',
    };
    const result = createCategorySchema.safeParse(category);
    expect(result.success).toBe(true);
  });

  it('should reject a category with a name that is too long', () => {
    const category = {
      name: 'Test Category'.repeat(10),
      color: '#000000',
      icon: 'Star',
    };
    const result = createCategorySchema.safeParse(category);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Name too long');
  });

  it('should reject a category with a color that is not a valid hex color', () => {
    const category = {
      name: 'Test Category',
      color: '#0000000',
      icon: 'Star',
    };
    const result = createCategorySchema.safeParse(category);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Invalid color format');
  });
});
