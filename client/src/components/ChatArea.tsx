import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store';
import { Send, Loader2, Bot, User, AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { sendMessage, regenerateResponse } from '../services/api';
import type { Message } from '../types';

export default function ChatArea() {
  const {
    getActiveConversation,
    agents,
    settings,
    addMessage,
    updateMessage,
    appendToMessage,
    createConversation,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const conversation = getActiveConversation();
  const conversationAgents = conversation
    ? agents.filter((a) => conversation.agentIds.includes(a.id))
    : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    let currentConversation = conversation;

    // Create new conversation if none exists
    if (!currentConversation) {
      const activeAgents = agents.filter((a) => a.isActive);
      if (activeAgents.length === 0) return;
      currentConversation = createConversation(activeAgents.slice(0, 1).map((a) => a.id));
    }

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    addMessage(currentConversation.id, {
      conversationId: currentConversation.id,
      agentId: null,
      role: 'user',
      content: userMessage,
    });

    // Get responses from each agent
    const targetAgents = agents.filter((a) => currentConversation!.agentIds.includes(a.id));

    try {
      await Promise.all(
        targetAgents.map(async (agent) => {
          // Add placeholder message for streaming
          const placeholderMessage = addMessage(currentConversation!.id, {
            conversationId: currentConversation!.id,
            agentId: agent.id,
            role: 'assistant',
            content: '',
            isStreaming: true,
          });

          try {
            await sendMessage({
              conversationId: currentConversation!.id,
              agentId: agent.id,
              message: userMessage,
              messageId: placeholderMessage.id,
              stream: settings.streamResponses,
              onStream: (chunk) => {
                appendToMessage(currentConversation!.id, placeholderMessage.id, chunk);
              },
              onComplete: (fullContent) => {
                updateMessage(currentConversation!.id, placeholderMessage.id, {
                  content: fullContent,
                  isStreaming: false,
                });
              },
              onError: (error) => {
                updateMessage(currentConversation!.id, placeholderMessage.id, {
                  content: '',
                  isStreaming: false,
                  error: error.message,
                });
              },
            });
          } catch (error) {
            updateMessage(currentConversation!.id, placeholderMessage.id, {
              isStreaming: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (settings.sendOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleRegenerate = async (message: Message) => {
    if (!conversation || isLoading) return;

    const agent = agents.find((a) => a.id === message.agentId);
    if (!agent) return;

    setIsLoading(true);

    // Find the last user message before this
    const messageIndex = conversation.messages.findIndex((m) => m.id === message.id);
    const userMessages = conversation.messages.slice(0, messageIndex).filter((m) => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (!lastUserMessage) return;

    updateMessage(conversation.id, message.id, {
      content: '',
      isStreaming: true,
      error: undefined,
    });

    try {
      await regenerateResponse({
        conversationId: conversation.id,
        agentId: agent.id,
        messageId: message.id,
        stream: settings.streamResponses,
        onStream: (chunk) => {
          appendToMessage(conversation.id, message.id, chunk);
        },
        onComplete: (fullContent) => {
          updateMessage(conversation.id, message.id, {
            content: fullContent,
            isStreaming: false,
          });
        },
        onError: (error) => {
          updateMessage(conversation.id, message.id, {
            isStreaming: false,
            error: error.message,
          });
        },
      });
    } catch (error) {
      updateMessage(conversation.id, message.id, {
        isStreaming: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAgentColor = (agentId: string | null) => {
    if (!agentId) return '#6b7280';
    const agent = agents.find((a) => a.id === agentId);
    return agent?.color || '#6b7280';
  };

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return 'You';
    const agent = agents.find((a) => a.id === agentId);
    return agent?.name || 'Unknown';
  };

  // Welcome screen when no conversation
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
            Welcome to Multi-Agent Chat
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Chat with multiple AI agents simultaneously. Get diverse perspectives and compare responses in real-time.
          </p>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {conversationAgents.length === 0 &&
              agents
                .filter((a) => a.isActive)
                .slice(0, 3)
                .map((agent) => (
                  <div
                    key={agent.id}
                    className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div
                      className="w-10 h-10 rounded-full mb-3 flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: agent.color }}
                    >
                      {agent.name.charAt(0)}
                    </div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{agent.model}</p>
                  </div>
                ))}
          </div>

          {/* Quick input */}
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message to start chatting..."
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg">{conversation.title}</h2>
          <div className="flex items-center gap-1">
            {conversationAgents.map((agent) => (
              <div
                key={agent.id}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: agent.color }}
                title={agent.name}
              >
                {agent.name.charAt(0)}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                message.role === 'user' ? 'bg-gray-600' : ''
              }`}
              style={message.role !== 'user' ? { backgroundColor: getAgentColor(message.agentId) } : {}}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                getAgentName(message.agentId).charAt(0)
              )}
            </div>

            {/* Content */}
            <div
              className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}
            >
              {/* Agent name for multi-agent */}
              {message.role === 'assistant' && conversation.isMultiAgent && (
                <span
                  className="text-xs font-medium mb-1"
                  style={{ color: getAgentColor(message.agentId) }}
                >
                  {getAgentName(message.agentId)}
                </span>
              )}

              <div
                className={`rounded-2xl px-4 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
                style={
                  message.role === 'assistant' && !settings.compactMode
                    ? { borderLeftColor: getAgentColor(message.agentId), borderLeftWidth: '3px' }
                    : {}
                }
              >
                {message.error ? (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{message.error}</span>
                    <button
                      onClick={() => handleRegenerate(message)}
                      className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                ) : message.isStreaming && !message.content ? (
                  <div className="flex items-center gap-1">
                    <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                  </div>
                ) : (
                  <div className={message.role === 'user' ? '' : 'prose dark:prose-invert max-w-none prose-sm'}>
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !match;
                            return isInline ? (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            ) : (
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-0.5" />
                    )}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              {settings.showTimestamps && (
                <span className="text-xs text-gray-400 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 p-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-xl transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        {!settings.sendOnEnter && (
          <p className="text-xs text-gray-400 mt-2">
            Press Shift+Enter for new line, click Send or Ctrl+Enter to send
          </p>
        )}
      </div>
    </div>
  );
}
