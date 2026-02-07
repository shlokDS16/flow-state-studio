import { Task, TaskStatus } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Droppable, Draggable } from '@hello-pangea/dnd';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  colorClass: string;
}

export function KanbanColumn({
  title,
  status,
  tasks,
  onAddTask,
  onDeleteTask,
  colorClass,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col bg-secondary/30 rounded-xl min-w-[320px] max-w-[350px] flex-1">
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

      {/* Droppable Tasks List */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 p-2 space-y-3 overflow-y-auto scrollbar-thin max-h-[calc(100vh-200px)] min-h-[200px] transition-colors duration-200",
              snapshot.isDraggingOver && "bg-primary/5 ring-2 ring-inset ring-primary/20 rounded-lg"
            )}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <TaskCard
                    task={task}
                    onDelete={onDeleteTask}
                    provided={provided}
                    isDragging={snapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No tasks yet
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
