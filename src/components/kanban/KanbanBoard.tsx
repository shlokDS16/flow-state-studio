import { useState, useCallback } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { KanbanColumn } from './KanbanColumn';
import { AddTaskDialog } from './AddTaskDialog';
import { Task, TaskStatus } from '@/types/task';
import { Loader2 } from 'lucide-react';

const columns = [
  { status: 'todo' as TaskStatus, title: 'To Do', colorClass: 'bg-column-todo text-white' },
  { status: 'in_progress' as TaskStatus, title: 'In Progress', colorClass: 'bg-column-progress text-black' },
  { status: 'done' as TaskStatus, title: 'Done', colorClass: 'bg-column-done text-white' },
];

export function KanbanBoard() {
  const { tasks, isLoading, createTask, deleteTask, moveTask } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<TaskStatus>('todo');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const handleAddTask = (status: TaskStatus) => {
    setDialogStatus(status);
    setDialogOpen(true);
  };

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, status: TaskStatus) => {
      e.preventDefault();
      if (draggedTask && draggedTask.status !== status) {
        moveTask.mutate({ id: draggedTask.id, status });
      }
      setDraggedTask(null);
    },
    [draggedTask, moveTask]
  );

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((task) => task.status === status);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              title={column.title}
              status={column.status}
              tasks={getTasksByStatus(column.status)}
              onAddTask={handleAddTask}
              onDeleteTask={(id) => deleteTask.mutate(id)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              colorClass={column.colorClass}
            />
          ))}
        </div>
      </div>

      <AddTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(task) => createTask.mutate(task)}
        defaultStatus={dialogStatus}
      />
    </>
  );
}
