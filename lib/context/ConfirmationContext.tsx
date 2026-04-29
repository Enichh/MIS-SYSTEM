"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary" | "info";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => void;
  closeConfirmation: () => void;
  isOpen: boolean;
  options: ConfirmationOptions | null;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);

  const confirm = useCallback((opts: ConfirmationOptions) => {
    setOptions(opts);
    setIsOpen(true);
    setIsLoading(false);
  }, []);

  const closeConfirmation = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setOptions(null);
      setIsLoading(false);
    }, 200); // Wait for modal exit animation
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return (
    <ConfirmationContext.Provider value={{ confirm, closeConfirmation, isOpen, options, isLoading, setLoading }}>
      {children}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (context === undefined) {
    throw new Error("useConfirmation must be used within a ConfirmationProvider");
  }
  return context;
}
