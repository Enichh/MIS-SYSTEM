import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat as useVercelChat } from '@ai-sdk/react';
import { CHAT_STORAGE_KEY } from '@/lib/constants';
import { StreamingChatMessage } from '@/lib/types/ai';
import { STREAMING_CONFIG } from '@/lib/utils/ai-config';
import type { KnowledgeQuery, KnowledgeResponse } from '@/types';

const FALLBACK_ENDPOINT = '/api/knowledge/query';
const STREAMING_ENDPOINT = '/api/knowledge/streaming';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  knowledgeData?: KnowledgeResponse;
}

const MAX_MESSAGE_LENGTH = 5000;

export function useChat() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [useStreaming, setUseStreaming] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    messages: vercelMessages,
    input: vercelInput,
    handleInputChange,
    handleSubmit,
    isLoading: isStreaming,
    error: streamingError,
    setMessages,
    reload,
    stop,
  } = useVercelChat({
    api: useStreaming ? STREAMING_ENDPOINT : FALLBACK_ENDPOINT,
    initialMessages: [],
    body: {
      context: STREAMING_CONFIG,
    },
    onError: (error) => {
      if (error.message.includes('404') || error.message.includes('fetch failed')) {
        setUseStreaming(false);
        setError('Streaming endpoint unavailable. Using fallback endpoint.');
      }
    },
  });

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLocalMessages(parsed);
          const streamingMessages: StreamingChatMessage[] = parsed.map((msg: ChatMessage) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp).toISOString(),
          }));
          setMessages(streamingMessages);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, [setMessages]);

  useEffect(() => {
    if (localMessages.length > 0) {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(localMessages));
      } catch (error) {
        console.error('Failed to save chat history:', error);
        if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
          setError('Storage quota exceeded. Chat history may not be saved.');
        }
      }
    }
  }, [localMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [vercelMessages, isStreaming]);

  useEffect(() => {
    if (streamingError) {
      setError(streamingError.message);
    }
  }, [streamingError]);

  useEffect(() => {
    const mappedMessages: ChatMessage[] = vercelMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: Date.now(),
    }));
    setLocalMessages(mappedMessages);
  }, [vercelMessages]);

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const message = input.trim();
    
    if (!message || isStreaming) return;
    
    if (message.length > MAX_MESSAGE_LENGTH) {
      console.error(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
      return;
    }

    setError(null);
    handleSubmit(e);
  }, [input, isStreaming, handleSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = useCallback(() => {
    setMessages([]);
    setLocalMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }, [setMessages]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const isMessageValid = (message: string) => {
    return message.trim().length > 0 && message.length <= MAX_MESSAGE_LENGTH;
  };

  return {
    messages: localMessages,
    input,
    setInput: (value: string) => {
      setInput(value);
      handleInputChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>);
    },
    isLoading: isStreaming,
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
  };
}
