import { ROUTES } from '@/src/config/constants';
import { Button } from '@/src/presentation/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/src/presentation/components/ui/card';
import { Check } from 'lucide-react';
import Link from 'next/link';

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Check Your Email</h1>
              <p className="text-sm text-muted-foreground">
                We've sent you a confirmation email. Please click the link in
                the email to verify your account and complete your registration.
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm text-left space-y-2">
              <p className="font-medium">Next steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the confirmation link</li>
                <li>You'll be redirected to Nowly</li>
                <li>Start managing your tasks!</li>
              </ol>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link href={ROUTES.LOGIN}>Back to Login</Link>
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Didn't receive an email? Check your spam folder or try signing up
            again.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
