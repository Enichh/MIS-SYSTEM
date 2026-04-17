'use client';

import BaseModal from '@/app/components/modals/BaseModal/BaseModal';
import type { ConfirmationConfig } from '@/types';
import { Button } from '@/app/components/ui/Button/Button';

interface ActionConfirmationProps extends Omit<ConfirmationConfig, 'initialFocus'> {
  initialFocus?: string;
}

const variantMap = {
  danger: 'danger' as const,
  warning: 'primary' as const,
  info: 'primary' as const,
};

const variantStyles = {
  danger: '',
  warning: 'btn-warning',
  info: '',
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
  const buttonVariant = variantMap[variant];
  const titleId = ariaLabelledBy || `${title.replace(/\s+/g, '-').toLowerCase()}-title`;
  const describedById = ariaDescribedBy || `${title.replace(/\s+/g, '-').toLowerCase()}-description`;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      closeOnOverlayClick={true}
      ariaLabelledBy={titleId}
      ariaLabel={ariaLabel}
      ariaDescribedBy={describedById}
    >
      <div className="space-y-4">
        <p id={describedById} className="text-gray-700">
          {message}
        </p>
        <div className="form-actions">
          <Button
            variant="outline"
            onClick={onCancel}
            aria-label="Cancel"
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={onConfirm}
            aria-label={confirmText}
            className={variant === 'warning' ? variantStyles.warning : ''}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
