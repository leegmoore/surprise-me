import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

  // Messages
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'createdAt'>) => Message;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  appendToMessage: (conversationId: string, messageId: string, content: string) => void;

  // Settings
  settings: ChatSettings;
  updateSettings: (updates: Partial<ChatSettings>) => void;

  // API Keys
  apiKeys: ApiKeyConfig;
  updateApiKeys: (keys: Partial<ApiKeyConfig>) => void;

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
    createdAt: new Date(),
  },
  {
    id: 'claude',
    name: 'Claude',
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    color: '#cc785c',
    systemPrompt: 'You are Claude, a helpful AI assistant.',
    temperature: 0.7,
    maxTokens: 4096,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'gpt-3.5',
    name: 'GPT-3.5',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    color: '#6366f1',
    systemPrompt: 'You are a helpful assistant.',
    temperature: 0.7,
    maxTokens: 4096,
    isActive: true,
    createdAt: new Date(),
  },
];

const defaultSettings: ChatSettings = {
  theme: 'system',
  sendOnEnter: true,
  showTimestamps: true,
  streamResponses: true,
  compactMode: false,
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Agents
      agents: defaultAgents,

      addAgent: (agentData) => {
        const agent: Agent = {
          ...agentData,
          id: uuidv4(),
          createdAt: new Date(),
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
        const conversation: Conversation = {
          id: uuidv4(),
          title: title || 'New Conversation',
          agentIds,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
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
            conv.id === id ? { ...conv, ...updates, updatedAt: new Date() } : conv
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

      // Messages
      addMessage: (conversationId, messageData) => {
        const message: Message = {
          ...messageData,
          id: uuidv4(),
          createdAt: new Date(),
        };
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages: [...conv.messages, message], updatedAt: new Date() }
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
                  updatedAt: new Date(),
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
      partialize: (state) => ({
        agents: state.agents,
        conversations: state.conversations,
        settings: state.settings,
        apiKeys: state.apiKeys,
      }),
    }
  )
);
