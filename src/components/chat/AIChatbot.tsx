import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, X, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';
import { TaskStatus, TaskPriority } from '@/types/task';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ParsedCommand {
  type: 'create' | 'move' | 'delete' | 'emoji' | 'list' | 'help' | 'chat';
  taskTitle?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  emoji?: string;
  description?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const QUICK_ACTIONS = [
  { label: '➕ Add task', command: 'Create a new task called ' },
  { label: '📋 List tasks', command: 'Show my tasks' },
  { label: '💡 Suggest', command: 'Suggest some tasks for me' },
  { label: '❓ Help', command: 'What can you do?' },
];

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { tasks, createTask, updateTask, deleteTask, moveTask } = useTasks();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const parseCommand = (text: string): ParsedCommand => {
    const lowerText = text.toLowerCase();
    
    // Create task patterns
    const createPatterns = [
      /(?:create|add|new)\s+(?:a\s+)?(?:task|todo)\s+(?:called\s+)?["']?(.+?)["']?(?:\s+(?:in|to)\s+(todo|in[_\s]?progress|done))?$/i,
      /(?:create|add)\s+["']?(.+?)["']?\s+(?:task|todo)/i,
    ];
    
    for (const pattern of createPatterns) {
      const match = text.match(pattern);
      if (match) {
        let status: TaskStatus = 'todo';
        if (match[2]) {
          const statusMap: Record<string, TaskStatus> = {
            'todo': 'todo',
            'in_progress': 'in_progress',
            'inprogress': 'in_progress',
            'in progress': 'in_progress',
            'done': 'done',
          };
          status = statusMap[match[2].toLowerCase().replace(/\s+/g, '_')] || 'todo';
        }
        return { type: 'create', taskTitle: match[1].trim(), status };
      }
    }
    
    // Move task patterns
    const movePattern = /(?:move|change)\s+["']?(.+?)["']?\s+(?:to|status)\s+(todo|in[_\s]?progress|done)/i;
    const moveMatch = text.match(movePattern);
    if (moveMatch) {
      const statusMap: Record<string, TaskStatus> = {
        'todo': 'todo',
        'in_progress': 'in_progress',
        'inprogress': 'in_progress',
        'in progress': 'in_progress',
        'done': 'done',
      };
      return {
        type: 'move',
        taskTitle: moveMatch[1].trim(),
        status: statusMap[moveMatch[2].toLowerCase().replace(/\s+/g, '_')] || 'todo',
      };
    }
    
    // Add emoji patterns
    const emojiPattern = /(?:add|put)\s+([\p{Emoji}\u200d]+)\s+(?:to|on|emoji\s+to)\s+["']?(.+?)["']?$/iu;
    const emojiMatch = text.match(emojiPattern);
    if (emojiMatch) {
      return { type: 'emoji', emoji: emojiMatch[1], taskTitle: emojiMatch[2].trim() };
    }
    
    // Alternative emoji pattern
    const emojiPattern2 = /(?:add|put)\s+emoji\s+([\p{Emoji}\u200d]+)\s+(?:to|on)\s+["']?(.+?)["']?$/iu;
    const emojiMatch2 = text.match(emojiPattern2);
    if (emojiMatch2) {
      return { type: 'emoji', emoji: emojiMatch2[1], taskTitle: emojiMatch2[2].trim() };
    }
    
    // Delete task patterns
    const deletePattern = /(?:delete|remove)\s+(?:task\s+)?["']?(.+?)["']?$/i;
    const deleteMatch = text.match(deletePattern);
    if (deleteMatch) {
      return { type: 'delete', taskTitle: deleteMatch[1].trim() };
    }
    
    // List tasks
    if (lowerText.includes('list') || lowerText.includes('show') && lowerText.includes('task')) {
      return { type: 'list' };
    }
    
    // Help
    if (lowerText.includes('help') || lowerText.includes('what can you do')) {
      return { type: 'help' };
    }
    
    return { type: 'chat' };
  };

  const handleCommand = async (command: ParsedCommand, userMessage: string): Promise<string | null> => {
    switch (command.type) {
      case 'create': {
        if (!command.taskTitle) return null;
        try {
          await createTask.mutateAsync({
            title: command.taskTitle,
            status: command.status || 'todo',
            priority: command.priority || 'medium',
          });
          return `✅ Created task "${command.taskTitle}" in ${command.status?.replace('_', ' ') || 'To Do'}!`;
        } catch {
          return `❌ Failed to create task. Please try again.`;
        }
      }
      
      case 'move': {
        if (!command.taskTitle || !command.status) return null;
        const task = tasks.find(t => 
          t.title.toLowerCase().includes(command.taskTitle!.toLowerCase())
        );
        if (!task) {
          return `❌ Couldn't find task "${command.taskTitle}". Available tasks: ${tasks.slice(0, 3).map(t => t.title).join(', ')}`;
        }
        try {
          await moveTask.mutateAsync({ id: task.id, status: command.status });
          return `✅ Moved "${task.title}" to ${command.status.replace('_', ' ')}!`;
        } catch {
          return `❌ Failed to move task. Please try again.`;
        }
      }
      
      case 'emoji': {
        if (!command.taskTitle || !command.emoji) return null;
        const task = tasks.find(t => 
          t.title.toLowerCase().includes(command.taskTitle!.toLowerCase())
        );
        if (!task) {
          return `❌ Couldn't find task "${command.taskTitle}".`;
        }
        try {
          const newTitle = task.title.startsWith(command.emoji) 
            ? task.title 
            : `${command.emoji} ${task.title}`;
          await updateTask.mutateAsync({ id: task.id, title: newTitle });
          return `✅ Added ${command.emoji} to "${task.title}"!`;
        } catch {
          return `❌ Failed to add emoji. Please try again.`;
        }
      }
      
      case 'delete': {
        if (!command.taskTitle) return null;
        const task = tasks.find(t => 
          t.title.toLowerCase().includes(command.taskTitle!.toLowerCase())
        );
        if (!task) {
          return `❌ Couldn't find task "${command.taskTitle}".`;
        }
        try {
          await deleteTask.mutateAsync(task.id);
          return `✅ Deleted task "${task.title}"!`;
        } catch {
          return `❌ Failed to delete task. Please try again.`;
        }
      }
      
      case 'list': {
        if (tasks.length === 0) {
          return "📋 You don't have any tasks yet. Try saying 'Create a task called...'";
        }
        const todoTasks = tasks.filter(t => t.status === 'todo');
        const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
        const doneTasks = tasks.filter(t => t.status === 'done');
        
        let response = "📋 **Your Tasks:**\n\n";
        if (todoTasks.length) {
          response += `**To Do (${todoTasks.length}):**\n${todoTasks.map(t => `• ${t.title}`).join('\n')}\n\n`;
        }
        if (inProgressTasks.length) {
          response += `**In Progress (${inProgressTasks.length}):**\n${inProgressTasks.map(t => `• ${t.title}`).join('\n')}\n\n`;
        }
        if (doneTasks.length) {
          response += `**Done (${doneTasks.length}):**\n${doneTasks.map(t => `• ${t.title}`).join('\n')}`;
        }
        return response;
      }
      
      case 'help': {
        return `🤖 **I can help you manage tasks!**

**Commands I understand:**
• "Create a task called [name]" - Add a new task
• "Add 🚀 to [task name]" - Add emoji to a task
• "Move [task] to done" - Change task status
• "Delete [task name]" - Remove a task
• "Show my tasks" - List all tasks

**I can also:**
• Suggest tasks based on your goals
• Answer questions about productivity
• Help organize your work

Just chat naturally and I'll do my best to help!`;
      }
      
      default:
        return null;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // First, try to parse as a command
      const command = parseCommand(userMessage.content);
      const commandResponse = await handleCommand(command, userMessage.content);
      
      if (commandResponse) {
        setMessages((prev) => [...prev, { role: 'assistant', content: commandResponse }]);
        setIsLoading(false);
        return;
      }
      
      // If not a command, send to AI
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          tasks: tasks.map(t => ({ title: t.title, status: t.status, priority: t.priority })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let assistantContent = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'assistant') {
                    return prev.map((m, i) =>
                      i === prev.length - 1 ? { ...m, content: assistantContent } : m
                    );
                  }
                  return [...prev, { role: 'assistant', content: assistantContent }];
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
          "bg-primary hover:bg-primary/90 text-primary-foreground"
        )}
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 w-96 h-[500px] z-50",
          "bg-card border border-border rounded-2xl shadow-2xl",
          "flex flex-col overflow-hidden transition-all duration-300",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-secondary/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">Manage tasks with natural language</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="p-3 border-b border-border flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => setInput(action.command)}
                className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Hi! I&apos;m your AI assistant.</p>
                <p className="mt-1">Try: &quot;Create a task called...&quot;</p>
                <p className="mt-1">or &quot;Add 🚀 to my task&quot;</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        msg.role === 'user' ? 'bg-primary' : 'bg-secondary'
                      )}
                    >
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <Bot className="w-4 h-4 text-foreground" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "px-4 py-2 rounded-2xl max-w-[80%]",
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <Bot className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-secondary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a command or question..."
              className="flex-1 bg-secondary border-border"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
