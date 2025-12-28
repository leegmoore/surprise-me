import { useChatStore } from '../store';
import {
  MessageSquare,
  Plus,
  Settings,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Users,
} from 'lucide-react';

export default function Sidebar() {
  const {
    conversations,
    activeConversationId,
    agents,
    isSidebarOpen,
    createConversation,
    setActiveConversation,
    deleteConversation,
    toggleSidebar,
    toggleSettings,
    toggleAgentPanel,
  } = useChatStore();

  const handleNewChat = () => {
    const activeAgents = agents.filter((a) => a.isActive);
    if (activeAgents.length > 0) {
      createConversation(activeAgents.map((a) => a.id));
    }
  };

  const handleNewMultiAgentChat = () => {
    const activeAgents = agents.filter((a) => a.isActive);
    if (activeAgents.length >= 2) {
      createConversation(
        activeAgents.slice(0, 3).map((a) => a.id),
        'Multi-Agent Chat'
      );
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <>
      {/* Toggle button when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-40 transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
            Multi-Agent Chat
          </h1>
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Buttons */}
        <div className="p-3 space-y-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
          <button
            onClick={handleNewMultiAgentChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium"
          >
            <Users className="w-5 h-5" />
            Multi-Agent Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8 px-4">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    activeConversationId === conv.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                  onClick={() => setActiveConversation(conv.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {conv.isMultiAgent && (
                        <Users className="w-4 h-4 flex-shrink-0 text-purple-500" />
                      )}
                      <p className="font-medium truncate text-sm">{conv.title}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {formatDate(conv.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={toggleAgentPanel}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
          >
            <Users className="w-5 h-5" />
            Manage Agents
          </button>
          <button
            onClick={toggleSettings}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </div>
      </aside>
    </>
  );
}
