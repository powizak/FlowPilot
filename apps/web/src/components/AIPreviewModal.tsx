import * as Dialog from '@radix-ui/react-dialog';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { ReactNode } from 'react';

export interface AIPreviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  isLoading?: boolean;
  content: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: ReactNode;
}

export function AIPreviewModal({
  isOpen,
  onOpenChange,
  title,
  isLoading,
  content,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  icon = <Sparkles className="h-5 w-5 text-indigo-400" />,
}: AIPreviewModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-2xl focus:outline-none">
          <div className="flex items-center gap-3 mb-4">
            {icon}
            <Dialog.Title className="text-lg font-medium text-text">
              {title}
            </Dialog.Title>
          </div>

          <div className="relative min-h-[100px] max-h-[60vh] overflow-y-auto mb-6 rounded-md border border-border/50 bg-bg p-4 text-sm text-text-secondary">
            {isLoading ? (
              <div className="flex h-full items-center justify-center py-8">
                <LoaderCircle className="h-6 w-6 animate-spin text-text-secondary" />
                <span className="ml-3">Generating suggestions...</span>
              </div>
            ) : (
              content
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="rounded-md px-4 py-2 text-sm font-medium text-text hover:bg-bg disabled:opacity-50 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-md bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
