'use client';

import { useEffect, useRef } from 'react';
import { ModalConfig, ModalSize } from '@/types';

interface BaseModalProps extends ModalConfig {
  children?: React.ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export default function BaseModal({
  isOpen,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  ariaLabelledBy,
  ariaLabel,
  ariaDescribedBy,
  initialFocus,
  returnFocus = true,
  children,
}: BaseModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      // Check if dialog is already open to prevent errors
      if (!dialog.open) {
        dialog.showModal();
      }
      
      if (initialFocus) {
        const focusElement = dialog.querySelector(initialFocus) as HTMLElement;
        focusElement?.focus();
      } else {
        const focusableElement = dialog.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        focusableElement?.focus();
      }
    } else {
      dialog.close();
      if (returnFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen, initialFocus, returnFocus]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [onClose]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (closeOnOverlayClick && event.target === dialogRef.current) {
      onClose();
    }
  };

  const titleId = ariaLabelledBy || `${title.replace(/\s+/g, '-').toLowerCase()}-title`;
  const describedById = ariaDescribedBy || `${title.replace(/\s+/g, '-').toLowerCase()}-description`;

  return (
    <dialog
      ref={dialogRef}
      className={`backdrop:bg-black/50 backdrop:backdrop-blur-sm bg-[var(--color-background-secondary)] border border-[var(--color-border-light)] rounded-xl shadow-[var(--shadow-xl)] p-6 ${sizeClasses[size]} transition-all duration-300 ease-in-out`}
      onClick={handleOverlayClick}
      aria-labelledby={titleId}
      aria-describedby={ariaDescribedBy ? describedById : undefined}
      aria-label={ariaLabel}
      aria-modal="true"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 id={titleId} className="text-xl font-semibold text-[var(--color-text)]">
          {title}
        </h2>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-background-tertiary)] rounded-lg p-1 transition-all duration-200"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {ariaDescribedBy && (
        <p id={describedById} className="sr-only">
          {ariaDescribedBy}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </dialog>
  );
}
