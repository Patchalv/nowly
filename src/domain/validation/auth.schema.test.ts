import { describe, expect, it } from 'vitest';
import {
  loginSchema,
  passwordSchema,
  resetPasswordConfirmSchema,
  resetPasswordRequestSchema,
  signupSchema,
} from './auth.schema';

describe('auth schema', () => {
  describe('password schema', () => {
    it('validates correct password', () => {
      const validPassword = 'Password123!';
      const result = passwordSchema.safeParse(validPassword);
      expect(result.success).toBe(true);
    });

    it('rejects password that has fewer than 8 characters', () => {
      const invalidPassword = 'Pass1!';
      const result = passwordSchema.safeParse(invalidPassword);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Password must be at least 8 characters'
      );
    });

    it('rejects password that does not include at least one lowercase letter', () => {
      const invalidPassword = 'PASSWORD123!';
      const result = passwordSchema.safeParse(invalidPassword);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Password must include at least one lowercase letter'
      );
    });

    it('rejects password that does not include at least one uppercase letter', () => {
      const invalidPassword = 'password123!';
      const result = passwordSchema.safeParse(invalidPassword);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Password must include at least one uppercase letter'
      );
    });

    it('rejects password that does not include at least one digit', () => {
      const invalidPassword = 'Password!';
      const result = passwordSchema.safeParse(invalidPassword);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Password must include at least one digit'
      );
    });

    it('rejects password that does not include at least one symbol', () => {
      const invalidPassword = 'Password123';
      const result = passwordSchema.safeParse(invalidPassword);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Password must include at least one symbol'
      );
    });
  });

  describe('signup schema', () => {
    it('validates correct signup data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };
      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Please enter a valid email address'
      );
    });
    it('rejects first name that is less than 1 character', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: '',
        lastName: 'Doe',
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('First name is required');
    });
  });

  describe('login schema', () => {
    it('validates correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Please enter a valid email address'
      );
    });

    it('rejects password that has fewer than 8 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Pass1!',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Password is required');
    });
  });

  describe('reset password request schema', () => {
    it('validates correct reset password request data', () => {
      const validData = {
        email: 'test@example.com',
      };
      const result = resetPasswordRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
      };
      const result = resetPasswordRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Please enter a valid email address'
      );
    });
  });

  describe('reset password confirm schema', () => {
    it('validates correct reset password confirm data', () => {
      const validData = {
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };
      const result = resetPasswordConfirmSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects password that does not match confirm password', () => {
      const invalidData = {
        password: 'Password123!',
        confirmPassword: 'Password123',
      };
      const result = resetPasswordConfirmSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Passwords don't match");
    });
  });
});
