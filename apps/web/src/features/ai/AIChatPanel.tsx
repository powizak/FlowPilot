import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  X,
  Send,
  ClipboardList,
  FileText,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import { ChatMessage } from './ChatMessage';
import { AIActionButton } from '../../components/AIActionButton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isLoading]);

  const getContext = () => {
    const context: { projectId?: string; taskId?: string } = {};
    const parts = pathname.split('/').filter(Boolean);

    const projectIdx = parts.indexOf('projects');
    if (projectIdx !== -1 && parts.length > projectIdx + 1) {
      context.projectId = parts[projectIdx + 1];
    }

    const taskIdx = parts.indexOf('tasks');
    if (taskIdx !== -1 && parts.length > taskIdx + 1) {
      context.taskId = parts[taskIdx + 1];
    }

    return context;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        message: text,
        context: getContext(),
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'No response received.',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '**Error:** Failed to get response from AI.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const quickActions = [
    {
      icon: <ClipboardList size={16} />,
      label: 'Decompose Task',
      prompt: 'Decompose the current task into subtasks',
    },
    {
      icon: <FileText size={16} />,
      label: 'Meeting Notes',
      prompt: 'Extract tasks from: \n\n',
    },
    {
      icon: <BarChart3 size={16} />,
      label: 'Weekly Summary',
      prompt: 'Generate a weekly review summary for this week',
    },
  ];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/20 z-40 transition-opacity w-full h-full cursor-default"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          aria-label="Close panel"
        />
      )}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-[340px] bg-background border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-[var(--color-surface)]">
          <h2 className="text-lg font-semibold text-foreground">
            AI Assistant
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-text-secondary)] hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
          ref={scrollRef}
        >
          {messages.length === 0 && (
            <div className="grid grid-cols-1 gap-2 mb-4">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    if (action.label === 'Meeting Notes') {
                      setInput(action.prompt);
                      textareaRef.current?.focus();
                    } else {
                      sendMessage(action.prompt);
                    }
                  }}
                  className="flex items-center gap-2 p-3 text-sm text-left border border-border rounded-lg bg-[var(--color-surface)] hover:border-blue-500 hover:text-blue-500 transition-colors group"
                >
                  <span className="text-[var(--color-text-secondary)] group-hover:text-blue-500 transition-colors">
                    {action.icon}
                  </span>
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
          ))}

          {isLoading && (
            <div className="flex w-full gap-3 py-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] border border-border text-blue-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
              <div className="relative px-4 py-3 text-sm rounded-2xl bg-[var(--color-surface)] border border-border rounded-tl-sm">
                <div className="flex gap-1 items-center h-full">
                  <span
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-background">
          {input.length > 20 && (
            <div className="mb-2 flex justify-end">
              <AIActionButton
                skillId="meeting-to-tasks"
                label="Extract Tasks"
                context={{ notes: input, ...getContext() }}
                previewTitle="Extracted Tasks from Notes"
                onResult={(result) => {
                  console.log('Would create tasks from meeting notes:', result);
                  setInput('');
                }}
                previewRenderer={(result) => (
                  <ul className="list-disc pl-4 space-y-2 text-sm text-zinc-200">
                    {(result.tasks || []).map((t: any, i: number) => (
                      <li key={i}>
                        <strong>{t.name}</strong>
                        {t.description && (
                          <p className="text-xs text-zinc-400 mt-1">
                            {t.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              />
            </div>
          )}
          <div className="relative flex items-end gap-2 bg-[var(--color-surface)] border border-border rounded-xl p-1 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI..."
              className="flex-1 max-h-[120px] min-h-[40px] w-full resize-none bg-transparent py-2.5 pl-3 pr-2 text-sm outline-none text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
              rows={1}
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="mb-1 mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white disabled:opacity-50 transition-opacity"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="mt-2 text-xs text-center text-[var(--color-text-secondary)]">
            Press Enter to send, Shift + Enter for newline
          </div>
        </div>
      </div>
    </>
  );
}
