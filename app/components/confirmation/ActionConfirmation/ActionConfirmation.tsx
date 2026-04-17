'use client';

import BaseModal from '@/components/modals/BaseModal/BaseModal';
import type { ConfirmationConfig } from '@/types';

interface ActionConfirmationProps extends Omit<ConfirmationConfig, 'initialFocus'> {
  initialFocus?: string;
}

const variantStyles = {
  danger: {
    confirm: 'bg-red-600 hover:bg-red-700 text-white',
    icon: 'text-red-600',
  },
  warning: {
    confirm: 'bg-orange-500 hover:bg-orange-600 text-white',
    icon: 'text-orange-500',
  },
  info: {
    confirm: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: 'text-blue-600',
  },
};

export default function ActionConfirmation({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  ariaLabelledBy,
  ariaLabel,
  ariaDescribedBy,
  initialFocus = '[aria-label="Cancel"]',
}: ActionConfirmationProps) {
  const styles = variantStyles[variant];

  const titleId = ariaLabelledBy || `${title.replace(/\s+/g, '-').toLowerCase()}-title`;
  const describedById = ariaDescribedBy || `${title.replace(/\s+/g, '-').toLowerCase()}-description`;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      showCloseButton={true}
      closeOnOverlayClick={true}
      ariaLabelledBy={titleId}
      ariaLabel={ariaLabel}
      ariaDescribedBy={describedById}
      initialFocus={initialFocus}
      returnFocus={true}
    >
      <div className="space-y-4">
        <p id={describedById} className="text-gray-700">
          {message}
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            aria-label="Cancel"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md transition-colors ${styles.confirm}`}
            aria-label={confirmText}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
