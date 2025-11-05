import { AuthFormContainer } from '@/src/presentation/components/authentication/AuthFormContainer';
import { ResetPasswordConfirmForm } from '@/src/presentation/components/authentication/ResetPasswordConfirmForm';
import { Card, CardContent } from '@/src/presentation/components/ui/card';
import { Suspense } from 'react';

function ResetPasswordFallback() {
  return (
    <Card className="w-full max-w-sm">
      <CardContent className="py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <AuthFormContainer
      form={
        <Suspense fallback={<ResetPasswordFallback />}>
          <ResetPasswordConfirmForm />
        </Suspense>
      }
    />
  );
}
