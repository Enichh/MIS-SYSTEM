'use client';

import { useChat } from '@/lib/hooks/useChat';
import { TrashIcon } from '@/app/components/ui/icons/custom/TrashIcon';
import { Button } from '@/app/components/ui/Button/Button';
import { Input } from '@/app/components/ui/Input/Input';
import { MarkdownRenderer } from '@/app/components/MarkdownRenderer/MarkdownRenderer';
import './StreamingChat.css';

export function StreamingChat() {
  const {
    messages,
    input,
    setInput,
    isLoading,
    error,
    messagesEndRef,
    handleSend,
    handleKeyDown,
    handleClearHistory,
    formatTimestamp,
    isMessageValid,
    MAX_MESSAGE_LENGTH,
    reload,
    stop,
  } = useChat();

  return (
    <div className="streaming-chat">
      <div className="chat-modal-header">
        <h3>Enoch AI</h3>
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
              <div className="chat-message chat-message-assistant">
                <div className="chat-message-content">
                  <MarkdownRenderer content="Hello! I'm EnochAI, your helpful assistant for this project management system. I can help you with creating employees, projects, and tasks; assigning employees to tasks and projects; searching for employees by skills or department; and updating existing tasks and projects. How can I assist you today?" />
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
              >
                <div className="chat-message-content">
                  {msg.role === 'assistant' ? (
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>
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

          {error && (
            <div className="chat-message-error" role="alert">
              <p>{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => reload()}
                aria-label="Retry last message"
              >
                Retry
              </Button>
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
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="chat-input-send"
            aria-label="Send message"
          >
            {isLoading ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  stop();
                }}
                className="chat-input-stop"
                role="button"
                tabIndex={0}
                aria-label="Stop generating"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    stop();
                  }
                }}
              >
                Stop
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
