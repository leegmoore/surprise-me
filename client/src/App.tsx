import { useEffect } from 'react';
import { useChatStore } from './store';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import AgentPanel from './components/AgentPanel';

export default function App() {
  const { settings, isSidebarOpen } = useChatStore();

  useEffect(() => {
    // Handle theme
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main
        className={`flex-1 flex transition-all duration-300 ${
          isSidebarOpen ? 'ml-72' : 'ml-0'
        }`}
      >
        <ChatArea />
        <AgentPanel />
      </main>

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}
