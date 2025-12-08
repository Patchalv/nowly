import type { Metadata } from 'next';

import { RecurringTasksPage } from '@/src/presentation/pages/recurring/RecurringTasksPage';

export const metadata: Metadata = {
  title: 'Recurring Tasks',
};

export default function RecurringPage() {
  return <RecurringTasksPage />;
}
