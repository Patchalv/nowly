import { UserProfile } from '@/src/domain/model/User';

export interface IUserProfileRepository {
  /**
   * Find the current user profile
   */
  findByUserId(userId: string): Promise<UserProfile | null>;
}
