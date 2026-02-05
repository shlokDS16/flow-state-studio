import { Task } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Calendar, GripVertical, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
}

const priorityConfig = {
  high: { label: 'High Priority', className: 'bg-priority-high/20 text-priority-high border-priority-high/30' },
  medium: { label: 'Important', className: 'bg-priority-medium/20 text-priority-medium border-priority-medium/30' },
  low: { label: 'Low Priority', className: 'bg-priority-low/20 text-priority-low border-priority-low/30' },
};

export function TaskCard({ task, onDelete, onDragStart }: TaskCardProps) {
  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      className={cn(
        "p-4 bg-card border-border/50 cursor-grab active:cursor-grabbing",
        "hover:border-primary/30 transition-all duration-200",
        "group relative"
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          {/* Priority Badge */}
          <Badge 
            variant="outline" 
            className={cn("text-xs mb-2", priorityConfig[task.priority].className)}
          >
            {priorityConfig[task.priority].label}
          </Badge>

          {/* Title */}
          <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.tags.map((tag, i) => (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="text-xs bg-secondary/50"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {task.due_date ? (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(task.due_date), 'MMM d')}</span>
              </div>
            ) : (
              <span />
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
