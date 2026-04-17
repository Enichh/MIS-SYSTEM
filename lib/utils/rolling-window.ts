export interface RollingWindowConfig {
  maxMessages: number;
  preserveSystemMessages?: boolean;
}

export interface Message {
  role?: string;
  [key: string]: any;
}

export const DEFAULT_ROLLING_WINDOW_CONFIG: RollingWindowConfig = {
  maxMessages: 50,
  preserveSystemMessages: true
};

function pruneOldestMessages(messages: Message[], config: RollingWindowConfig): Message[] {
  const { maxMessages, preserveSystemMessages } = config;
  
  if (messages.length <= maxMessages) {
    return messages;
  }

  if (preserveSystemMessages) {
    const systemMessages = messages.filter((msg: Message) => msg && typeof msg.role === 'string' && msg.role === 'system');
    const nonSystemMessages = messages.filter((msg: Message) => !msg || typeof msg.role !== 'string' || msg.role !== 'system');
    
    if (nonSystemMessages.length + systemMessages.length <= maxMessages) {
      return messages;
    }
    
    const prunedNonSystem = nonSystemMessages.slice(-(maxMessages - systemMessages.length));
    return [...systemMessages, ...prunedNonSystem];
  }

  return messages.slice(-maxMessages);
}

export function applyRollingWindow(messages: Message[], config: RollingWindowConfig = DEFAULT_ROLLING_WINDOW_CONFIG): Message[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  if (config.maxMessages < 1) {
    throw new Error('maxMessages must be at least 1');
  }

  return pruneOldestMessages([...messages], config);
}
