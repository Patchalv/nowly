import { Task } from '@/src/domain/model/Task';

export interface MutateTaskResponse {
  success: boolean;
  task?: Task;
  error?: string;
}

export interface ListTasksResponse {
  success: boolean;
  tasks?: Task[];
  error?: string;
}
