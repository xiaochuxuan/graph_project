import { notFound, redirect } from 'next/navigation';

import tasks from '@/data/acceptance-categories.json';
import legacyTasks from '@/data/acceptance-tasks.json';
import AcceptancePage from '@/components/acceptance/acceptance-page';

export function generateStaticParams() {
  return tasks.map((task) => ({ taskId: task.id }));
}

export default function Page({ params }) {
  const task = tasks.find((item) => item.id === params.taskId);
  const legacyTask = legacyTasks.find((item) => item.id === params.taskId);
  if (!task && legacyTask) redirect(`/dashboard/acceptance/${legacyTask.category}`);
  if (!task) notFound();
  return <AcceptancePage key={task.id} task={task} />;
}
