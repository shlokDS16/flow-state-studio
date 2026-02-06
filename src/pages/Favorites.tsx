import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { AIChatbot } from '@/components/chat/AIChatbot';
import { useTasks } from '@/hooks/useTasks';
import { TaskCard } from '@/components/kanban/TaskCard';
import { Star } from 'lucide-react';

export default function Favorites() {
  const { tasks, deleteTask } = useTasks();
  
  // High priority tasks are considered favorites
  const favoriteTasks = tasks.filter((t) => t.priority === 'high');

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col">
        <Header onAddTask={() => {}} showAddButton={false} />

        <div className="flex-1 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-6 h-6 text-primary fill-primary" />
            <h2 className="text-2xl font-bold text-foreground">Favorites</h2>
          </div>

          <p className="text-muted-foreground mb-6">
            High priority tasks are shown here as favorites.
          </p>

          {favoriteTasks.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No favorites yet</h3>
              <p className="text-muted-foreground">
                Mark tasks as high priority to see them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDelete={() => deleteTask.mutate(task.id)}
                  onDragStart={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AIChatbot />
    </div>
  );
}
