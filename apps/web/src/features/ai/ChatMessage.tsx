import { Fragment, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const segments = text.split(/(\*\*.*?\*\*)/g);

  return segments.filter(Boolean).map((segment, index) => {
    const key = `${keyPrefix}-${index}`;
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={key}>{segment.slice(2, -2)}</strong>;
    }

    return <Fragment key={key}>{segment}</Fragment>;
  });
}

function parseSimpleMarkdown(text: string): ReactNode {
  const lines = text.split('\n');
  const content: ReactNode[] = [];
  let listItems: string[] = [];
  let listCount = 0;

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    const currentList = listCount;
    listCount += 1;

    content.push(
      <ul key={`list-${currentList}`} className="list-disc pl-4 my-1 space-y-1">
        {listItems.map((item) => (
          <li key={item}>
            {renderInlineMarkdown(item, `list-${currentList}-${item}`)}
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line) => {
    if (line.startsWith('- ')) {
      listItems.push(line.slice(2));
      return;
    }

    flushList();

    if (line.length === 0) {
      content.push(<br key={`break-${content.length}`} />);
      return;
    }

    content.push(
      <Fragment key={`line-${content.length}-${line}`}>
        {renderInlineMarkdown(line, `line-${content.length}-${line}`)}
        <br />
      </Fragment>,
    );
  });

  flushList();

  return content;
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
        <div className="break-words">{parseSimpleMarkdown(content)}</div>
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <User size={18} />
        </div>
      )}
    </div>
  );
}
