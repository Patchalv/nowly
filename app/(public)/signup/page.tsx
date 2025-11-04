import { AuthFormContainer } from '@/src/presentation/components/authentication/AuthFormContainer';
import { SignUpForm } from '@/src/presentation/components/authentication/SignUpForm';

export default function SignupPage() {
  return <AuthFormContainer form={<SignUpForm />} />;
}
