/* eslint-disable react/no-danger */
import React from 'react';
import { cn } from '../../lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

function parseSimpleMarkdown(text: string) {
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/^- (.*)$/gm, '<li>$1</li>');
  html = html.replace(
    /(<li>.*<\/li>)/gs,
    '<ul class="list-disc pl-4 my-1 space-y-1">$1</ul>',
  );

  html = html.replace(/\n/g, '<br />');
  html = html.replace(/<br \/><li>/g, '<li>');
  html = html.replace(/<\/li><br \/>/g, '</li>');
  html = html.replace(/<ul(.*?)><br \/>/g, '<ul$1>');
  html = html.replace(/<\/ul><br \/>/g, '</ul>');

  return { __html: html };
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex w-full gap-3 py-3',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-blue-400">
          <Bot size={18} />
        </div>
      )}
      <div
        className={cn(
          'relative px-4 py-2 text-sm max-w-[85%] rounded-2xl',
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-tl-sm',
        )}
      >
        {/* eslint-disable-next-line react/no-danger */}
        <div
          className="break-words"
          dangerouslySetInnerHTML={parseSimpleMarkdown(content)}
        />
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <User size={18} />
        </div>
      )}
    </div>
  );
}
