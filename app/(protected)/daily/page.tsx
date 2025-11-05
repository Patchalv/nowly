import { logoutAction } from '@/app/actions/logoutAction';
import { Button } from '@/src/presentation/components/ui/button';

export default function DailyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Daily</h1>
      <p className="mt-4">Daily view coming soon...</p>
      <form action={logoutAction}>
        <Button type="submit">Log out</Button>
      </form>
    </main>
  );
}
