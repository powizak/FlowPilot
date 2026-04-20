import { NavLink } from 'react-router-dom';
import { Home, Folder, CheckSquare, Clock, BarChart, Settings, Search, Users } from 'lucide-react';
import { useUiStore } from '../stores/ui';
import { useAuthStore } from '../stores/auth';
import { useTranslation } from 'react-i18next';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTheme } from '../hooks/useTheme';

export default function Sidebar() {
  const { setSearchOpen } = useUiStore();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const { toggleTheme } = useTheme();

  const links = [
    { to: '/', icon: <Home className="h-4 w-4" />, label: 'Dashboard' },
    { to: '/projects', icon: <Folder className="h-4 w-4" />, label: 'Projects' },
    { to: '/clients', icon: <Users className="h-4 w-4" />, label: 'Clients' },
    { to: '/tasks', icon: <CheckSquare className="h-4 w-4" />, label: 'My Tasks' },
    { to: '/time', icon: <Clock className="h-4 w-4" />, label: 'Time Tracking' },
    { to: '/reports', icon: <BarChart className="h-4 w-4" />, label: 'Reports' },
    { to: '/settings', icon: <Settings className="h-4 w-4" />, label: 'Settings' },
  ];

  return (
    <aside className="flex w-60 flex-col border-r border-border bg-sidebar h-full">
      <div className="flex h-14 items-center px-4 font-semibold text-foreground">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-white mr-3">
          F
        </div>
        FlowPilot
      </div>

      <nav className="flex-1 space-y-1 px-2 py-2 overflow-y-auto">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-hover hover:text-foreground group"
        >
          <Search className="mr-3 h-4 w-4" />
          Search
          <kbd className="ml-auto text-xs opacity-50 group-hover:opacity-100">⌘K</kbd>
        </button>

        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-hover text-foreground'
                  : 'text-text-secondary hover:bg-hover hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`mr-3 ${isActive ? 'text-accent' : ''}`}>{link.icon}</span>
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="flex w-full items-center text-sm font-medium text-foreground hover:bg-hover rounded-md p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent font-semibold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="ml-3 truncate">{user?.name || 'User'}</div>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="w-56 rounded-md border border-border bg-sidebar p-2 shadow-lg" align="end" sideOffset={5}>
              <DropdownMenu.Item className="flex cursor-pointer items-center rounded px-2 py-2 text-sm text-foreground hover:bg-hover outline-none">
                <LanguageSwitcher />
              </DropdownMenu.Item>
              <DropdownMenu.Item 
                onClick={toggleTheme}
                className="flex cursor-pointer items-center rounded px-2 py-2 text-sm text-foreground hover:bg-hover outline-none"
              >
                Toggle Theme
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item 
                onClick={logout}
                className="flex cursor-pointer items-center rounded px-2 py-2 text-sm text-red-500 hover:bg-red-500/10 outline-none"
              >
                Log out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </aside>
  );
}
