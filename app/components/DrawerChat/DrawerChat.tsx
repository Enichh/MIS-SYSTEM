'use client';

import { TrashIcon } from '@/app/components/ui/icons/custom/TrashIcon';
import { Button } from '@/app/components/ui/Button/Button';
import { Input } from '@/app/components/ui/Input/Input';
import { useChat } from '@/lib/hooks/useChat';
import './DrawerChat.css';

export function DrawerChat() {
  const {
    messages,
    input,
    setInput,
    isLoading,
    messagesEndRef,
    handleSend,
    handleKeyDown,
    handleClearHistory,
    formatTimestamp,
    isMessageValid,
    MAX_MESSAGE_LENGTH,
  } = useChat();

  return (
    <div className="drawer-chat">
      <div className="chat-modal-header">
        <h3>AI Chat Assistant</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearHistory}
          aria-label="Delete chat history"
          className="chat-modal-delete"
        >
          <TrashIcon size={16} />
        </Button>
      </div>

      <div className="chat-message-list-container">
        <div className="chat-message-list">
          {messages.length === 0 && !isLoading ? (
            <div className="chat-message-empty">
              <p className="font-semibold mb-1">Start a conversation</p>
              <p className="text-small">Ask me anything about your MIS system</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
              >
                <div className="chat-message-content">{msg.content}</div>
                <div className="chat-message-meta">
                  <span className="chat-message-timestamp">{formatTimestamp(msg.timestamp)}</span>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="chat-message-loading">
              <div className="loading-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Chat message input"
            className="chat-input-textarea"
            disabled={isLoading}
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="chat-input-send"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
