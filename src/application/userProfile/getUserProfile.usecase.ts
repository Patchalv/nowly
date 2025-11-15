import { IUserProfileRepository } from '@/src/infrastructure/repositories/user/IUserProfileRepository';
import { logger } from '@sentry/nextjs';
import { GetUserProfileResponse } from './types';

export async function getUserProfile(
  userId: string,
  repository: IUserProfileRepository
): Promise<GetUserProfileResponse> {
  try {
    logger.info('Getting user profile');
    const userProfile = await repository.findByUserId(userId);

    if (!userProfile) {
      logger.error('User profile not found');
      return {
        success: false,
        userProfile: null,
        error: 'User profile not found',
      };
    }

    return { success: true, userProfile };
  } catch (error) {
    logger.error('Get user profile error', { error });
    return {
      success: false,
      userProfile: null,
      error:
        error instanceof Error ? error.message : 'Failed to fetch user profile',
    };
  }
}
