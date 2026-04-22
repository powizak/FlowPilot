import { useState, ReactNode } from 'react';
import { AxiosError } from 'axios';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { AIPreviewModal } from './AIPreviewModal';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data;
    if (
      typeof message === 'object' &&
      message !== null &&
      'message' in message &&
      typeof message.message === 'string'
    ) {
      return message.message;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Failed to execute AI skill';
}

export interface AIActionButtonProps<TResult> {
  skillId: string;
  context: Record<string, unknown>;
  onResult: (result: TResult) => void;
  label: string;
  icon?: ReactNode;
  className?: string;
  previewTitle?: string;
  previewRenderer?: (result: TResult) => ReactNode;
  skipPreview?: boolean;
}

export function AIActionButton<TResult>({
  skillId,
  context,
  onResult,
  label,
  icon = <Sparkles className="h-4 w-4" />,
  className,
  previewTitle = 'AI Suggestion',
  previewRenderer,
  skipPreview = false,
}: AIActionButtonProps<TResult>) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (!skipPreview) setIsOpen(true);

      const { data } = await api.post<{ result: TResult }>(
        `/ai/skills/${skillId}`,
        { context },
      );

      setResult(data.result);
      if (skipPreview) {
        onResult(data.result);
      }
    } catch (error) {
      console.error('AI Action failed:', error);
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (result) {
      onResult(result);
    }
    setIsOpen(false);
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-red-400 p-4 rounded-md bg-red-400/10 border border-red-400/20">
          {error}
        </div>
      );
    }
    if (isLoading) return null;
    if (!result) return null;

    if (previewRenderer) {
      return previewRenderer(result);
    }

    return (
      <pre className="whitespace-pre-wrap font-mono text-xs">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={handleExecute}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-2 rounded-md bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50 transition-colors',
          className,
        )}
      >
        {isLoading && skipPreview ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          icon
        )}
        {label}
      </button>

      {!skipPreview && (
        <AIPreviewModal
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          title={previewTitle}
          isLoading={isLoading}
          content={renderContent()}
          onConfirm={handleConfirm}
          onCancel={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
