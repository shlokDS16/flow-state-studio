import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, X, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';
import { TaskStatus, TaskPriority } from '@/types/task';
import { parseTimeEstimate, parseDueDate } from '@/lib/date-utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ParsedCommand {
  type: 'create' | 'move' | 'delete' | 'emoji' | 'update' | 'list' | 'help' | 'chat';
  taskTitle?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  emoji?: string;
  description?: string;
  dueDate?: string;
  timeEstimate?: number;
  field?: string;
  value?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const QUICK_ACTIONS = [
  { label: '➕ Add task', command: 'Create task: ' },
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
    
    // Enhanced create task with full metadata
    // Pattern: "Create task: 🏃 Morning jog, 30 minutes, tomorrow, Personal"
    const createFullPattern = /(?:create|add|new)\s+(?:a\s+)?(?:task|todo)(?:\s*:\s*|\s+called\s+|\s+)(.+)/i;
    const createMatch = text.match(createFullPattern);
    if (createMatch) {
      const content = createMatch[1];
      return parseTaskDetails(content);
    }
    
    // Move task patterns
    const movePatterns = [
      /(?:move|change|put)\s+["']?(.+?)["']?\s+(?:to|status)\s+(todo|to-?do|in[_\s-]?progress|done|completed?)/i,
      /(?:mark|set)\s+["']?(.+?)["']?\s+(?:as\s+)?(done|completed?|in[_\s-]?progress|todo)/i,
      /["']?(.+?)["']?\s+is\s+(done|completed?)/i,
    ];
    
    for (const pattern of movePatterns) {
      const match = text.match(pattern);
      if (match) {
        const status = normalizeStatus(match[2]);
        return { type: 'move', taskTitle: match[1].trim(), status };
      }
    }
    
    // Add emoji patterns
    const emojiPatterns = [
      /(?:add|put)\s+([\p{Emoji}\u200d]+)\s+(?:to|on|emoji\s+to)\s+["']?(.+?)["']?$/iu,
      /(?:add|put)\s+emoji\s+([\p{Emoji}\u200d]+)\s+(?:to|on)\s+["']?(.+?)["']?$/iu,
      /(?:give|add)\s+["']?(.+?)["']?\s+(?:a\s+)?([\p{Emoji}\u200d]+)\s*(?:emoji)?$/iu,
    ];
    
    for (const pattern of emojiPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Check which group has the emoji
        const hasEmojiFirst = /[\p{Emoji}]/u.test(match[1]);
        const emoji = hasEmojiFirst ? match[1] : match[2];
        const taskTitle = hasEmojiFirst ? match[2] : match[1];
        return { type: 'emoji', emoji, taskTitle: taskTitle.trim() };
      }
    }
    
    // Update task patterns
    const updatePatterns = [
      /(?:change|update|set)\s+(?:the\s+)?(time|duration|estimate)\s+(?:of|for)\s+["']?(.+?)["']?\s+to\s+(.+)/i,
      /(?:change|update|set)\s+(?:the\s+)?(due\s*date|date|deadline)\s+(?:of|for)\s+["']?(.+?)["']?\s+to\s+(.+)/i,
      /(?:change|update|set)\s+(?:the\s+)?(priority)\s+(?:of|for)\s+["']?(.+?)["']?\s+to\s+(.+)/i,
      /(?:change|update|set)\s+(?:the\s+)?(description)\s+(?:of|for)\s+["']?(.+?)["']?\s+to\s+(.+)/i,
    ];
    
    for (const pattern of updatePatterns) {
      const match = text.match(pattern);
      if (match) {
        return { 
          type: 'update', 
          field: match[1].toLowerCase().replace(/\s+/g, '_'), 
          taskTitle: match[2].trim(), 
          value: match[3].trim() 
        };
      }
    }
    
    // Delete task patterns
    const deletePattern = /(?:delete|remove)\s+(?:task\s+)?["']?(.+?)["']?$/i;
    const deleteMatch = text.match(deletePattern);
    if (deleteMatch) {
      return { type: 'delete', taskTitle: deleteMatch[1].trim() };
    }
    
    // List tasks
    if (lowerText.includes('list') || (lowerText.includes('show') && lowerText.includes('task'))) {
      return { type: 'list' };
    }
    
    // Help
    if (lowerText.includes('help') || lowerText.includes('what can you do')) {
      return { type: 'help' };
    }
    
    return { type: 'chat' };
  };

  const parseTaskDetails = (content: string): ParsedCommand => {
    let taskTitle = content;
    let status: TaskStatus = 'todo';
    let priority: TaskPriority = 'medium';
    let dueDate: string | undefined;
    let timeEstimate: number | undefined;
    
    // Extract emoji at the start
    const emojiMatch = content.match(/^([\p{Emoji}\u200d]+)\s*/u);
    
    // Split by common delimiters
    const parts = content.split(/[,;]/);
    const titlePart = parts[0].trim();
    
    // First part is the title (including emoji)
    taskTitle = titlePart;
    
    // Process remaining parts for metadata
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim().toLowerCase();
      
      // Check for time estimate
      const time = parseTimeEstimate(part);
      if (time) {
        timeEstimate = time;
        continue;
      }
      
      // Check for due date
      const date = parseDueDate(part);
      if (date) {
        dueDate = date;
        continue;
      }
      
      // Check for priority
      if (part.includes('urgent') || part.includes('high')) {
        priority = 'high';
        continue;
      }
      if (part.includes('personal') || part.includes('low')) {
        priority = 'low';
        continue;
      }
      if (part.includes('work') || part.includes('medium')) {
        priority = 'medium';
        continue;
      }
      
      // Check for status
      if (part.includes('in progress') || part.includes('in-progress')) {
        status = 'in_progress';
        continue;
      }
      if (part.includes('done') || part.includes('completed')) {
        status = 'done';
        continue;
      }
      if (part.includes('to-do') || part.includes('todo')) {
        status = 'todo';
        continue;
      }
    }
    
    return { 
      type: 'create', 
      taskTitle, 
      status, 
      priority, 
      dueDate, 
      timeEstimate 
    };
  };

  const normalizeStatus = (input: string): TaskStatus => {
    const lower = input.toLowerCase().replace(/[-_\s]/g, '');
    if (lower.includes('progress')) return 'in_progress';
    if (lower.includes('done') || lower.includes('complete')) return 'done';
    return 'todo';
  };

  const findTask = (taskTitle: string) => {
    // Try exact match first
    let task = tasks.find(t => t.title.toLowerCase() === taskTitle.toLowerCase());
    if (task) return task;
    
    // Try includes match
    task = tasks.find(t => t.title.toLowerCase().includes(taskTitle.toLowerCase()));
    if (task) return task;
    
    // Try matching without emoji
    task = tasks.find(t => {
      const cleanTitle = t.title.replace(/^[\p{Emoji}\u200d]+\s*/u, '');
      return cleanTitle.toLowerCase().includes(taskTitle.toLowerCase());
    });
    
    return task;
  };

  const handleCommand = async (command: ParsedCommand): Promise<string | null> => {
    switch (command.type) {
      case 'create': {
        if (!command.taskTitle) return null;
        try {
          await createTask.mutateAsync({
            title: command.taskTitle,
            status: command.status || 'todo',
            priority: command.priority || 'medium',
            due_date: command.dueDate,
            time_estimate: command.timeEstimate,
          });
          
          let response = `✅ Created task "${command.taskTitle}"`;
          const details: string[] = [];
          if (command.status !== 'todo') details.push(`in ${command.status.replace('_', ' ')}`);
          if (command.priority !== 'medium') details.push(`${command.priority} priority`);
          if (command.dueDate) details.push(`due ${command.dueDate}`);
          if (command.timeEstimate) {
            const hours = Math.floor(command.timeEstimate / 60);
            const mins = command.timeEstimate % 60;
            details.push(`${hours ? `${hours}h ` : ''}${mins ? `${mins}m` : ''}`);
          }
          if (details.length > 0) {
            response += ` (${details.join(', ')})`;
          }
          return response;
        } catch {
          return `❌ Failed to create task. Please try again.`;
        }
      }
      
      case 'move': {
        if (!command.taskTitle || !command.status) return null;
        const task = findTask(command.taskTitle);
        if (!task) {
          const suggestions = tasks.slice(0, 3).map(t => t.title).join(', ');
          return `❌ Couldn't find task "${command.taskTitle}". ${suggestions ? `Available tasks: ${suggestions}` : ''}`;
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
        const task = findTask(command.taskTitle);
        if (!task) {
          return `❌ Couldn't find task "${command.taskTitle}".`;
        }
        try {
          // Remove existing emoji at start if present
          const cleanTitle = task.title.replace(/^[\p{Emoji}\u200d]+\s*/u, '');
          const newTitle = `${command.emoji} ${cleanTitle}`;
          await updateTask.mutateAsync({ id: task.id, title: newTitle });
          return `✅ Added ${command.emoji} to "${cleanTitle}" → "${newTitle}"`;
        } catch {
          return `❌ Failed to add emoji. Please try again.`;
        }
      }
      
      case 'update': {
        if (!command.taskTitle || !command.field || !command.value) return null;
        const task = findTask(command.taskTitle);
        if (!task) {
          return `❌ Couldn't find task "${command.taskTitle}".`;
        }
        
        try {
          const updates: Record<string, unknown> = { id: task.id };
          
          if (command.field.includes('time') || command.field.includes('duration') || command.field.includes('estimate')) {
            const time = parseTimeEstimate(command.value);
            if (!time) return `❌ Couldn't parse time "${command.value}". Try "2h" or "30m".`;
            updates.time_estimate = time;
          } else if (command.field.includes('date') || command.field.includes('deadline')) {
            const date = parseDueDate(command.value);
            if (!date) return `❌ Couldn't parse date "${command.value}". Try "tomorrow" or "Oct 27".`;
            updates.due_date = date;
          } else if (command.field.includes('priority')) {
            const priorityMap: Record<string, TaskPriority> = {
              'high': 'high', 'urgent': 'high',
              'medium': 'medium', 'work': 'medium',
              'low': 'low', 'personal': 'low',
            };
            const p = priorityMap[command.value.toLowerCase()];
            if (!p) return `❌ Unknown priority "${command.value}". Use high, medium, or low.`;
            updates.priority = p;
          } else if (command.field.includes('description')) {
            updates.description = command.value;
          }
          
          await updateTask.mutateAsync(updates as { id: string });
          return `✅ Updated "${task.title}": ${command.field} → ${command.value}`;
        } catch {
          return `❌ Failed to update task. Please try again.`;
        }
      }
      
      case 'delete': {
        if (!command.taskTitle) return null;
        const task = findTask(command.taskTitle);
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
          return "📋 You don't have any tasks yet. Try saying 'Create task: Buy groceries 🛒, tomorrow, 30m'";
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
        return `🤖 **TaskFlow AI Assistant**

**Create Tasks with Full Details:**
• "Create task: 🏃 Morning jog, 30m, tomorrow, Personal"
• "Add task: Write report, 2h, urgent"
• "New task called Buy groceries 🛒"

**Manage Tasks:**
• "Add 🚀 to [task name]" - Add emoji
• "Move [task] to done" - Change status
• "Mark [task] as completed" - Complete task
• "Delete [task]" - Remove task

**Update Properties:**
• "Change time of [task] to 2h"
• "Update due date of [task] to tomorrow"
• "Set priority of [task] to high"

**Other:**
• "Show my tasks" - List all tasks
• General questions - I'll help!`;
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
      const commandResponse = await handleCommand(command);
      
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
          tasks: tasks.map(t => ({ 
            title: t.title, 
            status: t.status, 
            priority: t.priority,
            due_date: t.due_date,
            time_estimate: t.time_estimate,
          })),
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
                <p className="mt-2 text-xs">Try:</p>
                <p className="mt-1 text-xs">&quot;Create task: 🏃 Jog, 30m, tomorrow&quot;</p>
                <p className="mt-1 text-xs">&quot;Add 🚀 to my task&quot;</p>
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
              placeholder="Create task: 🎯 My goal, 1h..."
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
