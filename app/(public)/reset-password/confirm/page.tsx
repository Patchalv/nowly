import { AuthFormContainer } from '@/src/presentation/components/authentication/AuthFormContainer';
import { ResetPasswordConfirmForm } from '@/src/presentation/components/authentication/ResetPasswordConfirmForm';
import { FallbackView } from '@/src/presentation/components/loader/FallbackView';
import { Suspense } from 'react';

export default function ResetPasswordConfirmPage() {
  return (
    <AuthFormContainer
      form={
        <Suspense fallback={<FallbackView />}>
          <ResetPasswordConfirmForm />
        </Suspense>
      }
    />
  );
}
