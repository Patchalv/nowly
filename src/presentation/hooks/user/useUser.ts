import { getUserProfileAction } from '@/app/actions/userProfile/getUserProfileAction';
import { CACHE } from '@/src/config/constants';
import { queryKeys } from '@/src/config/query-keys';
import { handleError } from '@/src/shared/errors';
import { useQuery } from '@tanstack/react-query';

/**
 * Fetch the current user
 */
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.profile.detail,
    queryFn: async () => {
      const response = await getUserProfileAction();
      if (!response.success) {
        handleError.throw(response.error);
      }
      return response.userProfile;
    },
    staleTime: CACHE.USER_PROFILE_STALE_TIME_MS,
  });
}
