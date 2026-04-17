'use client';

import { StreamingChat } from '@/app/components/StreamingChat/StreamingChat';
import './DrawerChat.css';

export function DrawerChat() {
  return (
    <div className="drawer-chat">
      <StreamingChat />
    </div>
  );
}
