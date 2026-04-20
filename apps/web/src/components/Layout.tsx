import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CheckSquare, Clock, LayoutDashboard, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SearchModal from './SearchModal';
import { AIChatPanel } from '../features/ai/AIChatPanel';

export default function Layout() {
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tabs = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Tasks', icon: CheckSquare },
    { to: '/time', label: 'Time', icon: Clock },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden w-full h-full cursor-default"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSidebarOpen(false);
          }}
          aria-label="Close sidebar"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col min-w-0 transition-all duration-300">
        <Topbar
          onToggleAiChat={() => setIsAiChatOpen(!isAiChatOpen)}
          isAiChatOpen={isAiChatOpen}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)] md:hidden">
          <div className="grid grid-cols-4">
            {tabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-2 py-2 text-xs ${isActive ? 'text-foreground' : 'text-text-secondary'}`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="flex flex-col items-center gap-1 px-2 py-2 text-xs text-text-secondary"
            >
              <Menu className="h-4 w-4" />
              <span>More</span>
            </button>
          </div>
        </nav>
      </div>
      <AIChatPanel
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
      />
      <SearchModal />
    </div>
  );
}
