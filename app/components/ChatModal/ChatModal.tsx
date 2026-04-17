'use client'

import { useState } from 'react'
import { StreamingChat } from '@/app/components/StreamingChat/StreamingChat'
import { MessageIcon } from '@/app/components/ui/icons/custom/MessageIcon'
import { Modal, ModalContent } from '@/app/components/ui/Modal/Modal'

export default function ChatModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="chat-fab"
        aria-label="Open chat"
      >
        <MessageIcon size={24} />
      </button>

      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalContent className="chat-modal">
          <StreamingChat />
        </ModalContent>
      </Modal>
    </>
  )
}