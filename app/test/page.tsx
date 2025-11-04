import { AuthFormContainer } from '@/src/presentation/components/authentication/AuthFormContainer';
import { LogInForm } from '@/src/presentation/components/authentication/LogInForm';

export default function TestPage() {
  return <AuthFormContainer form={<LogInForm />} />;
}
