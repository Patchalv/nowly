import { UserProfile } from '@/src/domain/model/User';
import { logger } from '@sentry/nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, UserProfileRow } from '../../supabase/types';
import { timestampFromDatabase } from '../../supabase/utils/dates';
import type { IUserProfileRepository } from './IUserProfileRepository';

export class SupabaseUserProfileRepository implements IUserProfileRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Transform database row (snake_case, ISO strings) to domain entity (camelCase, Date objects)
   * - DATE fields (scheduled_date, due_date) use dateFromDatabase
   * - TIMESTAMPTZ fields (created_at, updated_at, completed_at) use timestampFromDatabase
   */
  private toDomain(row: UserProfileRow): UserProfile {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      timezone: row.timezone,
      createdAt: timestampFromDatabase(row.created_at),
      updatedAt: timestampFromDatabase(row.updated_at),
    };
  }

  /**
   * Transform domain entity to database row for inserts (all required fields)
   * - DATE fields use dateToDatabase
   * - TIMESTAMPTZ fields use timestampToDatabase
   */
  private toInsert(
    userProfile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>
  ): Database['public']['Tables']['user_profiles']['Insert'] {
    return {
      first_name: userProfile.firstName,
      last_name: userProfile.lastName,
      timezone: userProfile.timezone,
    };
  }

  /**
   * Transform domain entity to database row for updates (partial fields)
   * - DATE fields use dateToDatabase
   * - TIMESTAMPTZ fields use timestampToDatabase
   */
  private toDatabase(
    userProfile: Partial<UserProfile>
  ): Database['public']['Tables']['user_profiles']['Update'] {
    const result: Database['public']['Tables']['user_profiles']['Update'] = {};

    if (userProfile.firstName !== undefined)
      result.first_name = userProfile.firstName;
    if (userProfile.lastName !== undefined)
      result.last_name = userProfile.lastName;
    if (userProfile.timezone !== undefined)
      result.timezone = userProfile.timezone;

    return result;
  }

  /**
   * Find a user profile by ID
   */
  async findByUserId(id: string): Promise<UserProfile | null> {
    const { data, error } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error?.code === 'PGRST116') return null; // Not found
    if (error) {
      logger.error('Failed to find user profile', { error });
      throw new Error(`Failed to find user profile: ${error.message}`);
    }

    return data ? this.toDomain(data) : null;
  }
}
