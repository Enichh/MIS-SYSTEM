import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat as useVercelChat } from '@ai-sdk/react';
import type { ReportType, ReportData, ReportConfig } from '@/lib/types/reports';

const REPORT_ENDPOINT = '/api/reports/generate';
const CHAT_ENDPOINT = '/api/knowledge/streaming';

export interface ReportMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  reportData?: ReportData;
}

export interface UseReportChatReturn {
  messages: ReportMessage[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  currentReport: ReportData | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleSend: (e?: React.FormEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleClearHistory: () => void;
  formatTimestamp: (timestamp: number) => string;
  isMessageValid: (message: string) => boolean;
  MAX_MESSAGE_LENGTH: number;
  generateQuickReport: (reportType: ReportType) => void;
  reload: () => void;
}

const MAX_MESSAGE_LENGTH = 5000;

function formatReportAsText(reportData: ReportData): string {
  const summary = reportData.sections.map(s => `**${s.title}**\n${s.content}`).join('\n\n');
  const metricsText = reportData.metrics.map(m => `${m.label}: ${m.value}${m.unit ? ` ${m.unit}` : ''}`).join('\n');
  
  return `# ${reportData.title}\n\n**Generated:** ${new Date(reportData.generatedAt).toLocaleString()}\n\n## Metrics\n${metricsText}\n\n## Report Details\n${summary}`;
}

export function useReportChat(): UseReportChatReturn {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentReport, setCurrentReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const {
    messages: chatMessages,
    input: chatInput,
    handleInputChange,
    handleSubmit: handleChatSubmit,
    isLoading: chatLoading,
    error: chatError,
    setMessages,
    reload: chatReload,
  } = useVercelChat({
    api: CHAT_ENDPOINT,
    initialMessages: [],
  });

  const [messages, setLocalMessages] = useState<ReportMessage[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (chatError) {
      setError(chatError.message);
    }
  }, [chatError]);

  useEffect(() => {
    const mappedMessages: ReportMessage[] = chatMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: Date.now(),
    }));
    setLocalMessages(mappedMessages);
  }, [chatMessages]);

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const message = chatInput.trim();

    if (!message || chatLoading) return;

    if (message.length > MAX_MESSAGE_LENGTH) {
      console.error(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
      return;
    }

    setError(null);
    handleChatSubmit(e);
  }, [chatInput, chatLoading, handleChatSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = useCallback(() => {
    setMessages([]);
    setLocalMessages([]);
    setCurrentReport(null);
    setError(null);
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

  const setInput = useCallback((value: string) => {
    handleInputChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>);
  }, [handleInputChange]);

  const generateQuickReport = useCallback(async (reportType: ReportType) => {
    const reportConfig: ReportConfig = {
      type: reportType,
      includeCharts: true,
      includeMetrics: true,
    };

    const messageMap: Record<ReportType, string> = {
      employee_summary: 'Generate an employee summary report showing all employees, their departments, roles, and current project assignments.',
      project_status: 'Generate a project status report showing all projects, their progress, priority levels, and completion status.',
      task_overview: 'Generate a task overview report showing all tasks, their status, assigned employees, and due dates.',
      workload_analysis: 'Generate a workload analysis report showing employee task distribution and capacity.',
      custom: 'Generate a custom report based on current system data.',
    };

    const message = messageMap[reportType] || messageMap.custom;

    setError(null);
    setIsReportLoading(true);

    const userMessage: ReportMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch(REPORT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportConfig),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report');
      }

      const reportData: ReportData = await response.json();
      setCurrentReport(reportData);

      const assistantMessage: ReportMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formatReportAsText(reportData),
        timestamp: Date.now(),
        reportData,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsReportLoading(false);
    }
  }, [setMessages]);

  const reload = useCallback(() => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        setInput(lastUserMessage.content);
        setMessages((prev) => prev.slice(0, -1));
      }
    }
  }, [messages, setInput, setMessages]);

  return {
    messages,
    input: chatInput,
    setInput,
    isLoading: chatLoading || isReportLoading,
    error,
    currentReport,
    messagesEndRef,
    handleSend,
    handleKeyDown,
    handleClearHistory,
    formatTimestamp,
    isMessageValid,
    MAX_MESSAGE_LENGTH,
    generateQuickReport,
    reload,
  };
}
