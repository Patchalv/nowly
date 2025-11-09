import { describe, expect, it } from 'vitest';
import { updateUserProfileSchema } from './user.schema';

describe('user schema', () => {
  it('should validate a valid user profile', () => {
    const userProfile = {
      firstName: 'Test',
      lastName: 'User',
      timezone: 'America/New_York',
    };
    const result = updateUserProfileSchema.safeParse(userProfile);
    expect(result.success).toBe(true);
  });

  it('should reject a user profile with a first name that is too long', () => {
    const userProfile = {
      firstName: 'Test'.repeat(100),
      lastName: 'User',
      timezone: 'America/New_York',
    };
    const result = updateUserProfileSchema.safeParse(userProfile);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'First name must be less than 50 characters'
    );
  });

  it('should reject a user profile with a last name that is too long', () => {
    const userProfile = {
      firstName: 'Test',
      lastName: 'User'.repeat(100),
      timezone: 'America/New_York',
    };
    const result = updateUserProfileSchema.safeParse(userProfile);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Last name must be less than 50 characters'
    );
  });

  it('should reject a user profile with a timezone that is not a valid timezone', () => {
    const userProfile = {
      firstName: 'Test',
      lastName: 'User',
      timezone: 'Invalid/Timezone',
    };
    const result = updateUserProfileSchema.safeParse(userProfile);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Invalid timezone');
  });
});
