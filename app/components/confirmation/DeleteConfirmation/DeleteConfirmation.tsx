'use client';

import BaseModal from '@/components/modals/BaseModal/BaseModal';
import { useConfirmation } from '@/lib/hooks/useConfirmation';
import type { ConfirmationConfig } from '@/types';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  entityName: string;
  entityType: string;
  variant?: 'danger' | 'warning' | 'info';
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

export default function DeleteConfirmation({
  isOpen,
  onConfirm,
  onCancel,
  entityName,
  entityType,
  variant = 'danger',
}: DeleteConfirmationProps) {
  const styles = variantStyles[variant];

  const config: ConfirmationConfig = {
    isOpen,
    onConfirm,
    onCancel,
    title: `Delete ${entityType}`,
    message: `Are you sure you want to delete "${entityName}"? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant,
    ariaLabelledBy: `delete-${entityType.toLowerCase()}-title`,
    ariaLabel: `Delete ${entityType} confirmation`,
    ariaDescribedBy: `delete-${entityType.toLowerCase()}-description`,
    initialFocus: '[aria-label="Cancel"]',
  };

  return (
    <BaseModal
      isOpen={config.isOpen}
      onClose={config.onCancel}
      title={config.title}
      size="sm"
      showCloseButton={true}
      closeOnOverlayClick={true}
      ariaLabelledBy={config.ariaLabelledBy}
      ariaLabel={config.ariaLabel}
      ariaDescribedBy={config.ariaDescribedBy}
      initialFocus={config.initialFocus}
      returnFocus={true}
    >
      <div className="space-y-4">
        <p id={config.ariaDescribedBy} className="text-gray-700">
          {config.message}
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={config.onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            aria-label="Cancel"
          >
            {config.cancelText}
          </button>
          <button
            onClick={config.onConfirm}
            className={`px-4 py-2 rounded-md transition-colors ${styles.confirm}`}
            aria-label={`Delete ${entityName}`}
          >
            {config.confirmText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
