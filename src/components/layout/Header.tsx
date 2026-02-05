import { Search, Plus, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  onAddTask: () => void;
}

export function Header({ onAddTask }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Kanban Dashboard</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="w-64 pl-9 bg-secondary border-border"
          />
        </div>

        <Button variant="outline" size="icon" className="border-border">
          <Share2 className="w-4 h-4" />
        </Button>

        <Button onClick={onAddTask} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>
    </header>
  );
}
