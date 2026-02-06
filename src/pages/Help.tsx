import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { AIChatbot } from '@/components/chat/AIChatbot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, MessageSquare, Keyboard, Lightbulb } from 'lucide-react';

const faqs = [
  {
    question: 'How do I create a new task?',
    answer: 'Click the "Add Task" button in the header or use the "+" button in any column. You can also use the AI chatbot to create tasks using natural language.',
  },
  {
    question: 'How do I move tasks between columns?',
    answer: 'Simply drag and drop a task card from one column to another. The task status will be updated automatically.',
  },
  {
    question: 'What does the AI assistant do?',
    answer: 'The AI assistant can help you create tasks, suggest priorities, and answer questions about task management. Click the chat bubble in the bottom right corner to start a conversation.',
  },
  {
    question: 'How do I mark a task as high priority?',
    answer: 'When creating or editing a task, select "High" from the priority dropdown. High priority tasks will appear in your Favorites.',
  },
  {
    question: 'Can I add emojis to my tasks?',
    answer: 'Yes! You can add emojis directly in the task title or use the AI chatbot. Try saying "Add 🚀 to my task" or include emojis when creating tasks.',
  },
];

const tips = [
  'Use tags to organize related tasks across different columns',
  'Set due dates to stay on track with your deadlines',
  'High priority tasks automatically appear in your Favorites',
  'Ask the AI assistant for productivity tips and task suggestions',
];

export default function Help() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col">
        <Header onAddTask={() => {}} showAddButton={false} />

        <div className="flex-1 p-6 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Help & Support</h2>
          </div>

          {/* Quick Tips */}
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>Common questions about TaskFlow</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-foreground">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                AI Chatbot Commands
              </CardTitle>
              <CardDescription>Use natural language to manage tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">"Create a task called..."</span>
                  <span className="text-foreground">Creates a new task</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">"Add 🎯 emoji to..."</span>
                  <span className="text-foreground">Adds emoji to task</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">"Move task to done"</span>
                  <span className="text-foreground">Updates task status</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">"Suggest tasks for..."</span>
                  <span className="text-foreground">Gets AI suggestions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AIChatbot />
    </div>
  );
}
