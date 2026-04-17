'use client';

import { useState, useEffect } from 'react';
import type { QuickActionType, QuickActionConfig } from '@/lib/types/ai';
import { createQuickActionConfig } from '@/lib/utils/quick-actions';
import './QuickActionsBar.css';

const FEEDBACK_TIMEOUT_MS = 3000;

interface QuickActionsBarProps {
  onActionComplete?: (result: unknown) => void;
  onActionError?: (error: string) => void;
}

export default function QuickActionsBar({ onActionComplete, onActionError }: QuickActionsBarProps) {
  const [loading, setLoading] = useState<QuickActionType | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), FEEDBACK_TIMEOUT_MS);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const quickActions: QuickActionConfig[] = [
    createQuickActionConfig('create_task', 'Create Task', {}),
    createQuickActionConfig('assign_employee', 'Assign Employee', {}),
  ];

  const handleQuickAction = async (action: QuickActionConfig) => {
    setLoading(action.type);
    setFeedback(null);

    try {
      const response = await fetch('/api/quick-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: action.type,
          payload: action.payload,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFeedback({ type: 'success', message: `${action.label} completed successfully` });
        onActionComplete?.(data.result);
      } else {
        const errorMessage = data.message || `${action.label} failed`;
        setFeedback({ type: 'error', message: errorMessage });
        onActionError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setFeedback({ type: 'error', message: errorMessage });
      onActionError?.(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="quick-actions-bar">
      <div className="quick-actions-bar__title">Quick Actions</div>
      <div className="quick-actions-bar__buttons">
        {quickActions.map((action) => (
          <button
            key={action.type}
            className={`btn-secondary quick-actions-bar__button ${
              loading === action.type ? 'quick-actions-bar__button--loading' : ''
            }`}
            onClick={() => handleQuickAction(action)}
            disabled={loading !== null}
            aria-label={`Execute ${action.label}`}
            aria-busy={loading === action.type}
          >
            {loading === action.type ? (
              <span className="quick-actions-bar__loading-text">Processing...</span>
            ) : (
              action.label
            )}
          </button>
        ))}
      </div>
      {feedback && (
        <div
          className={`quick-actions-bar__feedback quick-actions-bar__feedback--${feedback.type}`}
          role="alert"
          aria-live="polite"
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
