import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { AIChatbot } from '@/components/chat/AIChatbot';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, ListTodo, TrendingUp } from 'lucide-react';

export default function Home() {
  const { tasks } = useTasks();

  const todoCount = tasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const completionRate = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const stats = [
    { title: 'To Do', value: todoCount, icon: ListTodo, color: 'text-blue-500' },
    { title: 'In Progress', value: inProgressCount, icon: Clock, color: 'text-yellow-500' },
    { title: 'Completed', value: doneCount, icon: CheckCircle2, color: 'text-green-500' },
    { title: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: 'text-purple-500' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col">
        <Header onAddTask={() => {}} showAddButton={false} />

        <div className="flex-1 p-6">
          <h2 className="text-2xl font-bold text-foreground mb-6">Dashboard Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.title} className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-muted-foreground">No tasks yet. Create your first task to get started!</p>
              ) : (
                <ul className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <li key={task.id} className="flex items-center gap-3 text-sm">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          task.status === 'done'
                            ? 'bg-green-500'
                            : task.status === 'in_progress'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <span className="text-foreground">{task.title}</span>
                      <span className="text-muted-foreground capitalize ml-auto">
                        {task.status.replace('_', ' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AIChatbot />
    </div>
  );
}
