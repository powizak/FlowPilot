import * as Dialog from '@radix-ui/react-dialog';
import { Search } from 'lucide-react';
import { useUiStore } from '../stores/ui';
import { useKeyboard } from '../hooks/useKeyboard';
import { useNavigate } from 'react-router-dom';

export default function SearchModal() {
  const { isSearchOpen, setSearchOpen } = useUiStore();
  const navigate = useNavigate();

  useKeyboard({ key: 'k', metaKey: true }, (e) => {
    e.preventDefault();
    setSearchOpen(true);
  });
  
  useKeyboard({ key: 'k', ctrlKey: true }, (e) => {
    e.preventDefault();
    setSearchOpen(true);
  });

  return (
    <Dialog.Root open={isSearchOpen} onOpenChange={setSearchOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2 rounded-lg border border-border bg-sidebar shadow-xl z-50 overflow-hidden">
          <div className="flex items-center border-b border-border px-4 py-3">
            <Search className="mr-3 h-5 w-5 text-text-secondary" />
            <input
              autoFocus
              className="flex-1 bg-transparent text-foreground placeholder:text-text-secondary focus:outline-none"
              placeholder="Search issues, projects, or commands..."
            />
          </div>
          <div className="px-4 py-4 text-sm text-text-secondary">
            <p>Recent searches or commands will appear here.</p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
