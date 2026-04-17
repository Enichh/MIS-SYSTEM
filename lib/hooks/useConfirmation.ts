'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseConfirmationReturn {
  isOpen: boolean;
  confirm: () => void;
  cancel: () => void;
  showConfirmation: (onConfirm: () => void, onCancel?: () => void) => void;
}

/**
 * Custom hook for managing confirmation dialog state
 * @returns Object containing confirmation state and control functions
 */
export function useConfirmation(): UseConfirmationReturn {
  const [isOpen, setIsOpen] = useState(false);
  const confirmCallback = useRef<(() => void) | null>(null);
  const cancelCallback = useRef<(() => void) | null>(null);

  const confirm = useCallback(() => {
    if (confirmCallback.current) {
      confirmCallback.current();
    }
    setIsOpen(false);
    confirmCallback.current = null;
    cancelCallback.current = null;
  }, []);

  const cancel = useCallback(() => {
    if (cancelCallback.current) {
      cancelCallback.current();
    }
    setIsOpen(false);
    confirmCallback.current = null;
    cancelCallback.current = null;
  }, []);

  const showConfirmation = useCallback((onConfirm: () => void, onCancel?: () => void) => {
    confirmCallback.current = onConfirm;
    cancelCallback.current = onCancel || (() => {});
    setIsOpen(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsOpen(false);
      confirmCallback.current = null;
      cancelCallback.current = null;
    };
  }, []);

  return {
    isOpen,
    confirm,
    cancel,
    showConfirmation,
  };
}
