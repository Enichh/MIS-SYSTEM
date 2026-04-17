'use client'

import { useState, useRef, useEffect } from 'react'
import { CHAT_STORAGE_KEY } from '@/lib/constants'
import type { KnowledgeQuery, KnowledgeResponse } from '@/types'
import { MessageIcon } from '@/app/components/ui/icons/custom/MessageIcon'
import { TrashIcon } from '@/app/components/ui/icons/custom/TrashIcon'
import { Button } from '@/app/components/ui/Button/Button'
import { Input } from '@/app/components/ui/Input/Input'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/app/components/ui/Modal/Modal'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  knowledgeData?: KnowledgeResponse
}

export default function ChatModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load chat history from localStorage
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setMessages(parsed)
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }, [])

  useEffect(() => {
    // Save chat history to localStorage
    if (messages.length > 0) {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
      } catch (error)
      {
        console.error('Failed to save chat history:', error)
      }
    }
  }, [messages])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async () => {
    const message = input.trim()
    if (!message || isLoading) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const query: KnowledgeQuery = {
        query: message,
      }

      const response = await fetch('/api/knowledge/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data: KnowledgeResponse = await response.json()

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: data.answer,
        timestamp: Date.now(),
        knowledgeData: data,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearHistory = () => {
    setMessages([])
    localStorage.removeItem(CHAT_STORAGE_KEY)
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes} ${ampm}`
  }

  return (
    <>
      {/* This button floats on the bottom right of the screen */}
      <Button
        className="chat-fab"
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
      >
        <MessageIcon size={28} />
      </Button>

      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalContent className="chat-modal">
          <ModalHeader className="chat-modal-header">
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
          </ModalHeader>

          <div className="chat-message-list-container">
            <div className="chat-message-list">
              {messages.length === 0 && !isLoading ? (
                <div className="chat-message-empty">
                  <p className="font-semibold mb-1">Start a conversation</p>
                  <p className="text-sm">Ask me anything about your MIS system</p>
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
        </ModalContent>
      </Modal>
    </>
  )
}