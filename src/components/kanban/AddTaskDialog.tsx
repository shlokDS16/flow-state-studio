import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateTaskInput, TaskPriority, TaskStatus } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { parseTimeEstimate } from '@/lib/date-utils';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: CreateTaskInput) => void;
  defaultStatus: TaskStatus;
}

export function AddTaskDialog({ open, onOpenChange, onSubmit, defaultStatus }: AddTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTime = parseTimeEstimate(timeEstimate);

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status: defaultStatus,
      due_date: dueDate || undefined,
      time_estimate: parsedTime || undefined,
      tags,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setTimeEstimate('');
    setTags([]);
    setTagInput('');
    onOpenChange(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (with emoji support 🎉)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="🚀 Enter task title..."
              className="bg-secondary border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              className="bg-secondary border-border resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="low">🟢 Personal</SelectItem>
                  <SelectItem value="medium">🟡 Work</SelectItem>
                  <SelectItem value="high">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeEstimate">Time Estimate</Label>
            <Input
              id="timeEstimate"
              value={timeEstimate}
              onChange={(e) => setTimeEstimate(e.target.value)}
              placeholder="e.g., 2h, 30m, 1h 30m"
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                className="bg-secondary border-border"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
