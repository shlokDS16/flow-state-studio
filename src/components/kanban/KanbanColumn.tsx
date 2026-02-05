import { Task, TaskStatus } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  colorClass: string;
}

export function KanbanColumn({
  title,
  status,
  tasks,
  onAddTask,
  onDeleteTask,
  onDragStart,
  onDragOver,
  onDrop,
  colorClass,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    onDrop(e, status);
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-secondary/30 rounded-xl min-w-[320px] max-w-[350px] flex-1",
        "transition-all duration-200",
        isDragOver && "ring-2 ring-primary/50 bg-secondary/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold", colorClass)}>
            {tasks.length}
          </div>
          <h2 className="font-semibold text-foreground">{title}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", colorClass, "bg-opacity-20 hover:bg-opacity-30")}
          onClick={() => onAddTask(status)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Tasks List */}
      <div className="flex-1 p-2 space-y-3 overflow-y-auto scrollbar-thin max-h-[calc(100vh-200px)]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDeleteTask}
            onDragStart={onDragStart}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No tasks yet
          </div>
        )}
      </div>
    </div>
  );
}
