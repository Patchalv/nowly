import { AuthFormContainer } from '@/src/presentation/components/authentication/AuthFormContainer';
import { ResetPasswordRequestForm } from '@/src/presentation/components/authentication/ResetPasswordRequestForm';

export default function ResetPasswordPage() {
  return <AuthFormContainer form={<ResetPasswordRequestForm />} />;
}
