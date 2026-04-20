import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  CheckSquare,
  FileText,
  FolderOpen,
  LoaderCircle,
  Search,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { useKeyboard } from '../hooks/useKeyboard';
import { useUiStore } from '../stores/ui';

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 5;

type SearchResponse = {
  projects: Array<{ id: string; name: string; description: string | null }>;
  tasks: Array<{ id: string; name: string; projectId: string; projectName?: string | null }>;
  clients: Array<{ id: string; name: string }>;
  invoices: Array<{ id: string; invoiceNumber: string; status: string }>;
};

type SearchItem = {
  id: string;
  type: 'project' | 'task' | 'client' | 'invoice' | 'recent';
  label: string;
  subtitle: string;
  icon: typeof FolderOpen;
  href?: string;
  term?: string;
};

const emptyResults: SearchResponse = {
  projects: [],
  tasks: [],
  clients: [],
  invoices: [],
};

function readRecentSearches(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string').slice(0, MAX_RECENT_SEARCHES) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  const normalized = term.trim();
  if (normalized.length < 2) return readRecentSearches();
  const next = [normalized, ...readRecentSearches().filter((value) => value !== normalized)].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
}

export default function SearchModal() {
  const { isSearchOpen, setSearchOpen } = useUiStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse>(emptyResults);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useKeyboard({ key: 'k', metaKey: true }, (event) => {
    event.preventDefault();
    setSearchOpen(true);
  });

  useKeyboard({ key: 'k', ctrlKey: true }, (event) => {
    event.preventDefault();
    setSearchOpen(true);
  });

  useEffect(() => {
    if (!isSearchOpen) {
      setQuery('');
      setResults(emptyResults);
      setIsLoading(false);
      setSelectedIndex(0);
      return;
    }

    setRecentSearches(readRecentSearches());
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const normalized = query.trim();
    if (normalized.length < 2) {
      setResults(emptyResults);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        const { data } = await api.get<SearchResponse>(`/search?q=${encodeURIComponent(normalized)}`);
        if (!cancelled) {
          setResults(data);
        }
      } catch {
        if (!cancelled) {
          setResults(emptyResults);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isSearchOpen, query]);

  const sections = useMemo(() => {
    if (query.trim().length === 0) {
      return recentSearches.length === 0
        ? []
        : [
            {
              key: 'recent',
              label: 'Recent searches',
              items: recentSearches.map<SearchItem>((term) => ({
                id: `recent-${term}`,
                type: 'recent',
                label: term,
                subtitle: 'Search again',
                icon: Search,
                term,
              })),
            },
          ];
    }

    return [
      {
        key: 'projects',
        label: 'Projects',
        items: results.projects.map<SearchItem>((project) => ({
          id: project.id,
          type: 'project',
          label: project.name,
          subtitle: project.description?.trim() || 'Project',
          icon: FolderOpen,
          href: `/projects/${project.id}`,
        })),
      },
      {
        key: 'tasks',
        label: 'Tasks',
        items: results.tasks.map<SearchItem>((task) => ({
          id: task.id,
          type: 'task',
          label: task.name,
          subtitle: task.projectName?.trim() || 'Task',
          icon: CheckSquare,
          href: `/projects/${task.projectId}`,
        })),
      },
      {
        key: 'clients',
        label: 'Clients',
        items: results.clients.map<SearchItem>((client) => ({
          id: client.id,
          type: 'client',
          label: client.name,
          subtitle: 'Client',
          icon: Users,
          href: `/clients/${client.id}`,
        })),
      },
      {
        key: 'invoices',
        label: 'Invoices',
        items: results.invoices.map<SearchItem>((invoice) => ({
          id: invoice.id,
          type: 'invoice',
          label: invoice.invoiceNumber,
          subtitle: invoice.status,
          icon: FileText,
          href: `/invoices/${invoice.id}`,
        })),
      },
    ].filter((section) => section.items.length > 0);
  }, [query, recentSearches, results]);

  const items = useMemo(() => sections.flatMap((section) => section.items), [sections]);

  useEffect(() => {
    setSelectedIndex(items.length === 0 ? -1 : 0);
  }, [query, items.length]);

  const openItem = (item: SearchItem) => {
    if (item.type === 'recent' && item.term) {
      setQuery(item.term);
      return;
    }

    const normalized = query.trim();
    if (normalized.length >= 2) {
      setRecentSearches(saveRecentSearch(normalized));
    }
    if (item.href) {
      navigate(item.href);
      setSearchOpen(false);
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (items.length > 0) {
        setSelectedIndex((current) => (current + 1) % items.length);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (items.length > 0) {
        setSelectedIndex((current) => (current <= 0 ? items.length - 1 : current - 1));
      }
      return;
    }

    if (event.key === 'Enter' && selectedIndex >= 0) {
      event.preventDefault();
      const item = items[selectedIndex];
      if (item) {
        openItem(item);
      }
    }
  };

  const showNoResults = query.trim().length >= 2 && !isLoading && items.length === 0;

  return (
    <Dialog.Root open={isSearchOpen} onOpenChange={setSearchOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-[14%] z-50 w-full max-w-2xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-sidebar shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-5 w-5 text-text-secondary" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-text-secondary focus:outline-none"
              placeholder="Search projects, tasks, clients, invoices..."
            />
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin text-text-secondary" /> : null}
          </div>

          <div className="max-h-[28rem] overflow-y-auto p-2">
            {sections.map((section) => (
              <div key={section.key} className="mb-3 last:mb-0">
                <div className="px-2 py-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
                  {section.label}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const itemIndex = items.findIndex((entry) => entry.id === item.id && entry.type === item.type);
                    const Icon = item.icon;

                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        onClick={() => openItem(item)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                          itemIndex === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-text-secondary" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-foreground">{item.label}</div>
                          <div className="truncate text-xs text-text-secondary">{item.subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {query.trim().length === 0 && recentSearches.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-text-secondary">No recent searches yet.</div>
            ) : null}

            {showNoResults ? (
              <div className="px-3 py-8 text-center text-sm text-text-secondary">
                No results for '{query.trim()}'
              </div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
