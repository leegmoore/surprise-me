import { useState } from 'react';
import { useChatStore } from '../store';
import { X, Plus, Trash2, Edit2, Check, Wrench, Zap } from 'lucide-react';
import type { Agent, AgentProvider } from '../types';

const providerModels: Record<AgentProvider, string[]> = {
  openai: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022'],
  google: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  custom: [],
};

const providerColors: Record<AgentProvider, string> = {
  openai: '#10a37f',
  anthropic: '#cc785c',
  google: '#4285f4',
  custom: '#6b7280',
};

export default function AgentPanel() {
  const { agents, isAgentPanelOpen, toggleAgentPanel, addAgent, updateAgent, deleteAgent } =
    useChatStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newAgent, setNewAgent] = useState<Partial<Agent>>({
    name: '',
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    color: '#10a37f',
    systemPrompt: 'You are a helpful assistant.',
    temperature: 0.7,
    maxTokens: 4096,
    isActive: true,
  });

  if (!isAgentPanelOpen) return null;

  const handleCreate = () => {
    if (!newAgent.name || !newAgent.model) return;
    addAgent(newAgent as Omit<Agent, 'id' | 'createdAt'>);
    setIsCreating(false);
    setNewAgent({
      name: '',
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      color: '#10a37f',
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      maxTokens: 4096,
      isActive: true,
    });
  };

  const handleProviderChange = (provider: AgentProvider) => {
    const models = providerModels[provider];
    setNewAgent({
      ...newAgent,
      provider,
      model: models[0] || '',
      color: providerColors[provider],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold">Agent Management</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Configure AI agents with tool calling capabilities
            </p>
          </div>
          <button
            onClick={toggleAgentPanel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                      style={{ backgroundColor: agent.color }}
                    >
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{agent.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{agent.provider}</span>
                        <span>•</span>
                        <span>{agent.model}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                          <Wrench className="w-3 h-3" />
                          Tools Enabled
                        </span>
                        <span className="flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                          <Zap className="w-3 h-3" />
                          Agentic
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agent.isActive}
                        onChange={(e) => updateAgent(agent.id, { isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                    </label>
                    <button
                      onClick={() => setEditingId(editingId === agent.id ? null : agent.id)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Edit form */}
                {editingId === agent.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                          type="text"
                          value={agent.name}
                          onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Color</label>
                        <input
                          type="color"
                          value={agent.color}
                          onChange={(e) => updateAgent(agent.id, { color: e.target.value })}
                          className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Temperature</label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={agent.temperature}
                          onChange={(e) =>
                            updateAgent(agent.id, { temperature: parseFloat(e.target.value) })
                          }
                          className="w-full"
                        />
                        <span className="text-sm text-gray-500">{agent.temperature}</span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Max Tokens</label>
                        <input
                          type="number"
                          value={agent.maxTokens}
                          onChange={(e) =>
                            updateAgent(agent.id, { maxTokens: parseInt(e.target.value) })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">System Prompt</label>
                      <textarea
                        value={agent.systemPrompt}
                        onChange={(e) => updateAgent(agent.id, { systemPrompt: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Create new agent */}
            {isCreating ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-primary-500">
                <h3 className="font-semibold mb-4">Create New Agent</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={newAgent.name}
                        onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                        placeholder="My Agent"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Provider</label>
                      <select
                        value={newAgent.provider}
                        onChange={(e) => handleProviderChange(e.target.value as AgentProvider)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="google">Google</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Model</label>
                      <select
                        value={newAgent.model}
                        onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      >
                        {providerModels[newAgent.provider as AgentProvider]?.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Color</label>
                      <input
                        type="color"
                        value={newAgent.color}
                        onChange={(e) => setNewAgent({ ...newAgent, color: e.target.value })}
                        className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">System Prompt</label>
                    <textarea
                      value={newAgent.systemPrompt}
                      onChange={(e) => setNewAgent({ ...newAgent, systemPrompt: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCreate}
                      disabled={!newAgent.name || !newAgent.model}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Create Agent
                    </button>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors flex items-center justify-center gap-2 text-gray-500 hover:text-primary-500"
              >
                <Plus className="w-5 h-5" />
                Add New Agent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
