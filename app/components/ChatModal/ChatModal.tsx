'use client'

import { useState, useRef, useEffect } from 'react'
import { CHAT_STORAGE_KEY } from '@/lib/constants'
import type { KnowledgeQuery, KnowledgeResponse } from '@/types'
import { MessageIcon } from '@/components/ui/icons/custom/MessageIcon'
import { TrashIcon } from '@/components/ui/icons/custom/TrashIcon'
import { Button } from '@/components/ui/Button/Button'
import { Input } from '@/components/ui/Input/Input'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal/Modal'

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
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    } catch (error) {
      console.error('Failed to save chat history:', error)
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
      <Button
        className="fab-button"
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
      >
        <MessageIcon size={24} />
      </Button>

      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalContent className="fixed right-4 bottom-4 left-auto top-auto translate-x-0 translate-y-0 max-w-md w-[calc(100vw-2rem)]">
          <ModalHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <ModalTitle className="text-lg font-semibold">AI Chat Assistant</ModalTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              aria-label="Delete chat history"
              className="h-8 w-8 rounded-lg p-0"
            >
              <TrashIcon size={16} />
            </Button>
          </ModalHeader>
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-hidden">
            <div className="flex-1 overflow-y-auto rounded-lg bg-muted/30 p-4">
              <div className="flex flex-col gap-3">
                {messages.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No messages yet. Start a conversation!</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 max-w-[85%] ${
                      msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-1.5 py-2">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0.1s' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="Chat message input"
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  className="h-10 w-10 rounded-xl shrink-0 p-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </Button>
              </div>
            </div>
        </ModalContent>
      </Modal>
    </>
  )
}
