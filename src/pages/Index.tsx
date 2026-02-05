import { useState } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { AIChatbot } from '@/components/chat/AIChatbot';
import { AddTaskDialog } from '@/components/kanban/AddTaskDialog';
import { useTasks } from '@/hooks/useTasks';

const Index = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { createTask } = useTasks();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col">
        <Header onAddTask={() => setDialogOpen(true)} />
        <KanbanBoard />
      </div>

      <AIChatbot />

      <AddTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(task) => createTask.mutate(task)}
        defaultStatus="todo"
      />
    </div>
  );
};

export default Index;
