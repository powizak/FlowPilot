import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SearchModal from './SearchModal';
import { AIChatPanel } from '../features/ai/AIChatPanel';

export default function Layout() {
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <AIChatPanel
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
      />
      <SearchModal />
    </div>
  );
}
