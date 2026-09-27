import { redirect } from 'next/navigation';

import tasks from '@/data/acceptance-categories.json';

export default function Page() {
  redirect(`/dashboard/acceptance/${tasks[0].id}`);
}
