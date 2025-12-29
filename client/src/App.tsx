import { useEffect, useCallback } from 'react';
import { useChatStore } from './store';
import { ErrorBoundary } from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import AgentPanel from './components/AgentPanel';
import { cancelAllRequests } from './services/api';

export default function App() {
  const {
    settings,
    isSidebarOpen,
    toggleSidebar,
    toggleSettings,
    createConversation,
    agents,
  } = useChatStore();

  // Handle theme changes
  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => {
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
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        // Allow Escape to blur inputs
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K - New conversation
      if (isMod && e.key === 'k') {
        e.preventDefault();
        const activeAgents = agents.filter((a) => a.isActive);
        if (activeAgents.length > 0) {
          createConversation(activeAgents.slice(0, 1).map((a) => a.id));
        }
      }

      // Cmd/Ctrl + B - Toggle sidebar
      if (isMod && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      // Cmd/Ctrl + , - Open settings
      if (isMod && e.key === ',') {
        e.preventDefault();
        toggleSettings();
      }

      // Escape - Cancel ongoing requests
      if (e.key === 'Escape') {
        cancelAllRequests();
      }
    },
    [agents, createConversation, toggleSidebar, toggleSettings]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAllRequests();
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main
          className={`flex-1 flex transition-all duration-300 ${
            isSidebarOpen ? 'ml-72' : 'ml-0'
          }`}
        >
          <ErrorBoundary>
            <ChatArea />
          </ErrorBoundary>
          <AgentPanel />
        </main>

        {/* Settings Modal */}
        <SettingsModal />

        {/* Keyboard shortcuts hint */}
        <div className="fixed bottom-4 right-4 text-xs text-gray-400 dark:text-gray-600 hidden lg:block">
          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">⌘K</kbd> New chat
          <span className="mx-2">•</span>
          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">⌘B</kbd> Toggle sidebar
          <span className="mx-2">•</span>
          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">⌘,</kbd> Settings
        </div>
      </div>
    </ErrorBoundary>
  );
}
