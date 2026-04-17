'use client';

import BaseModal from '@/components/modals/BaseModal/BaseModal';

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

  const title = `Delete ${entityType}`;
  const message = `Are you sure you want to delete "${entityName}"? This action cannot be undone.`;
  const ariaLabelledBy = `delete-${entityType.toLowerCase()}-title`;
  const ariaLabel = `Delete ${entityType} confirmation`;
  const ariaDescribedBy = `delete-${entityType.toLowerCase()}-description`;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      showCloseButton={true}
      closeOnOverlayClick={true}
      ariaLabelledBy={ariaLabelledBy}
      ariaLabel={ariaLabel}
      ariaDescribedBy={ariaDescribedBy}
      initialFocus='[aria-label="Cancel"]'
      returnFocus={true}
    >
      <div className="space-y-4">
        <p id={ariaDescribedBy} className="text-gray-700">
          {message}
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md transition-colors ${styles.confirm}`}
            aria-label={`Delete ${entityName}`}
          >
            Delete
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
