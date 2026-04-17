'use client';

import BaseModal from '@/components/modals/BaseModal/BaseModal';
import { Button } from '@/components/ui/Button/Button';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  entityName: string;
  entityType: string;
  variant?: 'danger' | 'warning' | 'info';
}

const variantMap = {
  danger: 'danger' as const,
  warning: 'primary' as const,
  info: 'primary' as const,
};

const variantStyles = {
  danger: '',
  warning: 'bg-orange-500 hover:bg-orange-600 text-white',
  info: '',
};

export default function DeleteConfirmation({
  isOpen,
  onConfirm,
  onCancel,
  entityName,
  entityType,
  variant = 'danger',
}: DeleteConfirmationProps) {
  const buttonVariant = variantMap[variant];

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
      closeOnOverlayClick={true}
      ariaLabelledBy={ariaLabelledBy}
      ariaLabel={ariaLabel}
      ariaDescribedBy={ariaDescribedBy}
    >
      <div className="space-y-4">
        <p id={ariaDescribedBy} className="text-gray-700">
          {message}
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            aria-label="Cancel"
          >
            Cancel
          </Button>
          <Button
            variant={buttonVariant}
            onClick={onConfirm}
            aria-label={`Delete ${entityName}`}
            className={variant === 'warning' ? variantStyles.warning : ''}
          >
            Delete
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
