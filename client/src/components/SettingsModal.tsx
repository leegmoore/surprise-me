import { useChatStore } from '../store';
import { X, Moon, Sun, Monitor, Key } from 'lucide-react';

export default function SettingsModal() {
  const { settings, apiKeys, isSettingsOpen, toggleSettings, updateSettings, updateApiKeys } =
    useChatStore();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={toggleSettings}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Appearance
            </h3>
            <div className="flex gap-2">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => updateSettings({ theme: value as 'light' | 'dark' | 'system' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                    settings.theme === value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Chat
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <span>Send on Enter</span>
                <input
                  type="checkbox"
                  checked={settings.sendOnEnter}
                  onChange={(e) => updateSettings({ sendOnEnter: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <span>Show Timestamps</span>
                <input
                  type="checkbox"
                  checked={settings.showTimestamps}
                  onChange={(e) => updateSettings({ showTimestamps: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <span>Stream Responses</span>
                <input
                  type="checkbox"
                  checked={settings.streamResponses}
                  onChange={(e) => updateSettings({ streamResponses: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <span>Compact Mode</span>
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) => updateSettings({ compactMode: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
              </label>
            </div>
          </div>

          {/* API Keys */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  value={apiKeys.openai || ''}
                  onChange={(e) => updateApiKeys({ openai: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Anthropic API Key</label>
                <input
                  type="password"
                  value={apiKeys.anthropic || ''}
                  onChange={(e) => updateApiKeys({ anthropic: e.target.value })}
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Google AI API Key</label>
                <input
                  type="password"
                  value={apiKeys.google || ''}
                  onChange={(e) => updateApiKeys({ google: e.target.value })}
                  placeholder="..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                API keys are stored locally in your browser and sent only to your backend server.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleSettings}
            className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
