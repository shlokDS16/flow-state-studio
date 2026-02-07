export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  time_estimate: number | null;
  tags: string[];
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
  time_estimate?: number;
  tags?: string[];
}
