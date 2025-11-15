import { UserProfile } from '@/src/domain/model/User';

export interface GetUserProfileResponse {
  success: boolean;
  userProfile?: UserProfile | null;
  error?: string;
}
