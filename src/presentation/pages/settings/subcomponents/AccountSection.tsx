'use client';

import { LogoutButton } from '@/src/presentation/components/buttons/LogoutButton';
import { Skeleton } from '@/src/presentation/components/ui/skeleton';
import { useUserProfile } from '@/src/presentation/hooks/user/useUser';
import { useTimezone } from '@/src/presentation/hooks/useTimezone';

export const AccountDetailsSection = () => {
  const { data: userProfile, isLoading, error } = useUserProfile();
  const { timezone, hasUserTimezone } = useTimezone(
    userProfile?.timezone || undefined
  );

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (error) {
    return <div className="text-destructive">{error.message}</div>;
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">Account Details</h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            <p className="text-sm text-muted-foreground">Name:</p>
            <p className="text-sm font-medium">
              {[userProfile?.firstName, userProfile?.lastName]
                .filter(Boolean)
                .join(' ') || 'Not set'}
            </p>
          </div>
          <div className="flex gap-1">
            <p className="text-sm text-muted-foreground">Timezone:</p>
            <p className="text-sm font-medium">
              {timezone}
              {hasUserTimezone ? null : ' (Browser)'}
            </p>
          </div>
        </div>
        <div className="flex">
          <LogoutButton />
        </div>
      </div>
    </section>
  );
};
