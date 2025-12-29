import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Agent, Conversation, Message, ChatSettings, ApiKeyConfig } from '../types';

interface ChatStore {
  // Agents
  agents: Agent[];
  addAgent: (agent: Omit<Agent, 'id' | 'createdAt'>) => Agent;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  getAgent: (id: string) => Agent | undefined;

  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  createConversation: (agentIds: string[], title?: string) => Conversation;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  getActiveConversation: () => Conversation | undefined;
  searchConversations: (query: string) => Conversation[];
  exportConversation: (id: string, format: 'json' | 'markdown') => string;
  clearAllConversations: () => void;

  // Messages
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'createdAt'>) => Message;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  appendToMessage: (conversationId: string, messageId: string, content: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;

  // Settings
  settings: ChatSettings;
  updateSettings: (updates: Partial<ChatSettings>) => void;

  // API Keys (stored separately with encryption consideration)
  apiKeys: ApiKeyConfig;
  updateApiKeys: (keys: Partial<ApiKeyConfig>) => void;
  clearApiKeys: () => void;

  // UI State
  isSidebarOpen: boolean;
  isSettingsOpen: boolean;
  isAgentPanelOpen: boolean;
  toggleSidebar: () => void;
  toggleSettings: () => void;
  toggleAgentPanel: () => void;
}

const defaultAgents: Agent[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    color: '#10a37f',
    systemPrompt: 'You are a helpful assistant.',
    temperature: 0.7,
    maxTokens: 4096,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'claude',
    name: 'Claude',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    color: '#cc785c',
    systemPrompt: 'You are Claude, a helpful AI assistant.',
    temperature: 0.7,
    maxTokens: 4096,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'gemini',
    name: 'Gemini',
    provider: 'google',
    model: 'gemini-1.5-pro',
    color: '#4285f4',
    systemPrompt: 'You are a helpful assistant.',
    temperature: 0.7,
    maxTokens: 4096,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const defaultSettings: ChatSettings = {
  theme: 'system',
  sendOnEnter: true,
  showTimestamps: true,
  streamResponses: true,
  compactMode: false,
};

/**
 * Custom storage with date serialization handling
 */
const customStorage = createJSONStorage<ChatStore>(() => localStorage, {
  reviver: (_key, value) => {
    // Don't convert date strings to Date objects - keep as ISO strings
    return value;
  },
  replacer: (_key, value) => {
    // Dates are already stored as ISO strings
    return value;
  },
});

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Agents
      agents: defaultAgents,

      addAgent: (agentData) => {
        const agent: Agent = {
          ...agentData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ agents: [...state.agents, agent] }));
        return agent;
      },

      updateAgent: (id, updates) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id ? { ...agent, ...updates } : agent
          ),
        }));
      },

      deleteAgent: (id) => {
        set((state) => ({
          agents: state.agents.filter((agent) => agent.id !== id),
        }));
      },

      getAgent: (id) => {
        return get().agents.find((agent) => agent.id === id);
      },

      // Conversations
      conversations: [],
      activeConversationId: null,

      createConversation: (agentIds, title) => {
        const now = new Date().toISOString();
        const conversation: Conversation = {
          id: uuidv4(),
          title: title || 'New Conversation',
          agentIds,
          messages: [],
          createdAt: now,
          updatedAt: now,
          isMultiAgent: agentIds.length > 1,
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: conversation.id,
        }));
        return conversation;
      },

      updateConversation: (id, updates) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id
              ? { ...conv, ...updates, updatedAt: new Date().toISOString() }
              : conv
          ),
        }));
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== id),
          activeConversationId:
            state.activeConversationId === id ? null : state.activeConversationId,
        }));
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((conv) => conv.id === activeConversationId);
      },

      searchConversations: (query) => {
        const { conversations } = get();
        const lowerQuery = query.toLowerCase();
        return conversations.filter(
          (conv) =>
            conv.title.toLowerCase().includes(lowerQuery) ||
            conv.messages.some((msg) =>
              msg.content.toLowerCase().includes(lowerQuery)
            )
        );
      },

      exportConversation: (id, format) => {
        const { conversations, agents } = get();
        const conv = conversations.find((c) => c.id === id);
        if (!conv) return '';

        if (format === 'json') {
          return JSON.stringify(conv, null, 2);
        }

        // Markdown format
        let md = `# ${conv.title}\n\n`;
        md += `*Created: ${new Date(conv.createdAt).toLocaleString()}*\n\n`;
        md += `---\n\n`;

        for (const msg of conv.messages) {
          const agent = msg.agentId ? agents.find((a) => a.id === msg.agentId) : null;
          const sender = msg.role === 'user' ? 'You' : agent?.name || 'Assistant';
          md += `### ${sender}\n\n${msg.content}\n\n`;
        }

        return md;
      },

      clearAllConversations: () => {
        set({ conversations: [], activeConversationId: null });
      },

      // Messages
      addMessage: (conversationId, messageData) => {
        const message: Message = {
          ...messageData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  updatedAt: new Date().toISOString(),
                  // Auto-generate title from first user message
                  title:
                    conv.title === 'New Conversation' &&
                    messageData.role === 'user' &&
                    conv.messages.length === 0
                      ? messageData.content.slice(0, 50) + (messageData.content.length > 50 ? '...' : '')
                      : conv.title,
                }
              : conv
          ),
        }));
        return message;
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : conv
          ),
        }));
      },

      appendToMessage: (conversationId, messageId, content) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId
                      ? { ...msg, content: msg.content + content }
                      : msg
                  ),
                }
              : conv
          ),
        }));
      },

      deleteMessage: (conversationId, messageId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.filter((msg) => msg.id !== messageId),
                  updatedAt: new Date().toISOString(),
                }
              : conv
          ),
        }));
      },

      // Settings
      settings: defaultSettings,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      // API Keys
      apiKeys: {},

      updateApiKeys: (keys) => {
        set((state) => ({
          apiKeys: { ...state.apiKeys, ...keys },
        }));
      },

      clearApiKeys: () => {
        set({ apiKeys: {} });
      },

      // UI State
      isSidebarOpen: true,
      isSettingsOpen: false,
      isAgentPanelOpen: false,

      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
      },

      toggleSettings: () => {
        set((state) => ({ isSettingsOpen: !state.isSettingsOpen }));
      },

      toggleAgentPanel: () => {
        set((state) => ({ isAgentPanelOpen: !state.isAgentPanelOpen }));
      },
    }),
    {
      name: 'multi-agent-chat-storage',
      storage: customStorage,
      version: 1,
      partialize: (state) => ({
        agents: state.agents,
        conversations: state.conversations,
        settings: state.settings,
        // Note: API keys are included but consider using a more secure storage method in production
        apiKeys: state.apiKeys,
      }),
      migrate: (persistedState, version) => {
        // Handle migrations between versions
        if (version === 0) {
          // Migration from version 0 to 1
          return persistedState as ChatStore;
        }
        return persistedState as ChatStore;
      },
    }
  )
);

// Selectors for optimized renders
export const useActiveConversation = () =>
  useChatStore((state) => {
    const { conversations, activeConversationId } = state;
    return conversations.find((c) => c.id === activeConversationId);
  });

export const useAgents = () => useChatStore((state) => state.agents);
export const useSettings = () => useChatStore((state) => state.settings);
export const useApiKeys = () => useChatStore((state) => state.apiKeys);
