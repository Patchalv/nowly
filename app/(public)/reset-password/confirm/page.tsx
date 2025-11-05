import { AuthFormContainer } from '@/src/presentation/components/authentication/AuthFormContainer';
import { ResetPasswordConfirmForm } from '@/src/presentation/components/authentication/ResetPasswordConfirmForm';

export default function ResetPasswordConfirmPage() {
  return <AuthFormContainer form={<ResetPasswordConfirmForm />} />;
}
