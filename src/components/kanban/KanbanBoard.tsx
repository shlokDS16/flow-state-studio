import { useState, useCallback } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { KanbanColumn } from './KanbanColumn';
import { AddTaskDialog } from './AddTaskDialog';
import { TaskStatus } from '@/types/task';
import { Loader2 } from 'lucide-react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

const columns = [
  { status: 'todo' as TaskStatus, title: 'To Do', colorClass: 'bg-column-todo text-white' },
  { status: 'in_progress' as TaskStatus, title: 'In Progress', colorClass: 'bg-column-progress text-black' },
  { status: 'done' as TaskStatus, title: 'Done', colorClass: 'bg-column-done text-white' },
];

export function KanbanBoard() {
  const { tasks, isLoading, createTask, deleteTask, moveTask, reorderTasks } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<TaskStatus>('todo');

  const handleAddTask = (status: TaskStatus) => {
    setDialogStatus(status);
    setDialogOpen(true);
  };

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result;

      // Dropped outside a valid droppable
      if (!destination) return;

      // Dropped in same position
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      const newStatus = destination.droppableId as TaskStatus;
      const oldStatus = source.droppableId as TaskStatus;

      // If moved to a different column, update status
      if (oldStatus !== newStatus) {
        moveTask.mutate({ id: draggableId, status: newStatus });
      } else {
        // Reorder within the same column
        const columnTasks = tasks
          .filter((t) => t.status === oldStatus)
          .sort((a, b) => a.position - b.position);
        
        const taskIds = columnTasks.map((t) => t.id);
        const [removed] = taskIds.splice(source.index, 1);
        taskIds.splice(destination.index, 0, removed);
        
        reorderTasks.mutate({ status: oldStatus, taskIds });
      }
    },
    [tasks, moveTask, reorderTasks]
  );

  const getTasksByStatus = (status: TaskStatus) =>
    tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.position - b.position);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
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
                colorClass={column.colorClass}
              />
            ))}
          </div>
        </div>
      </DragDropContext>

      <AddTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(task) => createTask.mutate(task)}
        defaultStatus={dialogStatus}
      />
    </>
  );
}
