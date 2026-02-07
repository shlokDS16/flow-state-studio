import { Task } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatSmartDate, formatTimeEstimate } from '@/lib/date-utils';

interface FavoriteTaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
}

const priorityConfig = {
  high: { 
    label: 'Urgent', 
    className: 'bg-priority-high/20 text-[hsl(var(--priority-high))] border-priority-high/30' 
  },
  medium: { 
    label: 'Work', 
    className: 'bg-priority-medium/20 text-[hsl(var(--priority-medium))] border-priority-medium/30' 
  },
  low: { 
    label: 'Personal', 
    className: 'bg-priority-low/20 text-[hsl(var(--priority-low))] border-priority-low/30' 
  },
};

// Extract emoji from the beginning of title
function extractEmoji(title: string): { emoji: string | null; cleanTitle: string } {
  const emojiRegex = /^([\p{Emoji}\u200d]+)\s*/u;
  const match = title.match(emojiRegex);
  if (match) {
    return {
      emoji: match[1],
      cleanTitle: title.slice(match[0].length),
    };
  }
  return { emoji: null, cleanTitle: title };
}

export function FavoriteTaskCard({ task, onDelete }: FavoriteTaskCardProps) {
  const { emoji, cleanTitle } = extractEmoji(task.title);
  const smartDate = formatSmartDate(task.due_date);
  const timeDisplay = formatTimeEstimate(task.time_estimate);

  return (
    <Card className={cn(
      "p-4 bg-card border-border/50",
      "hover:border-primary/30 transition-all duration-200",
      "group relative"
    )}>
      <div className="flex-1 min-w-0">
        {/* Priority Badge */}
        <Badge 
          variant="outline" 
          className={cn("text-xs mb-2", priorityConfig[task.priority].className)}
        >
          {priorityConfig[task.priority].label}
        </Badge>

        {/* Title with Emoji */}
        <h3 className="font-semibold text-foreground mb-1 line-clamp-2 flex items-center gap-1.5">
          {emoji && <span className="text-lg">{emoji}</span>}
          <span>{cleanTitle}</span>
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

        {/* Footer with metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {smartDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{smartDate}</span>
              </div>
            )}
            {timeDisplay && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{timeDisplay}</span>
              </div>
            )}
          </div>
          
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
    </Card>
  );
}
