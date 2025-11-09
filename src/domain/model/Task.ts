import { BonusSection, DailySection, TaskPriority } from '../types/tasks';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  scheduledDate: Date | null;
  dueDate: Date | null;
  completed: boolean;
  completedAt: Date | null;
  categoryId: string | null;
  priority: TaskPriority | null;
  dailySection: DailySection | null;
  bonusSection: BonusSection | null;
  position: string;
  recurringItemId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
