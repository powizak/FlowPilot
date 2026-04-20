import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SearchModal from './SearchModal';
import { AIChatPanel } from '../features/ai/AIChatPanel';

export default function Layout() {
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 transition-all duration-300">
        <Topbar
          onToggleAiChat={() => setIsAiChatOpen(!isAiChatOpen)}
          isAiChatOpen={isAiChatOpen}
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
