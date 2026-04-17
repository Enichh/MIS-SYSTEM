'use client';

import { ModalConfig, ModalSize } from '@/types';
import { getIcon, IconName } from '@/lib/utils/icon-utils';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '../../ui/Modal/Modal';

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
  closeOnOverlayClick = true,
  ariaLabelledBy,
  ariaLabel,
  ariaDescribedBy,
  children,
}: BaseModalProps) {
  const titleId = ariaLabelledBy || `${title?.replace(/\s+/g, '-').toLowerCase()}-title`;
  const describedById = ariaDescribedBy || `${title?.replace(/\s+/g, '-').toLowerCase()}-description`;

  const handleOpenChange = (open: boolean) => {
    // Call onClose when dialog is being closed (open becomes false)
    if (!open) {
      onClose()
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={handleOpenChange}>
      <ModalContent className={sizeClasses[size]}>
        <ModalHeader>
          <ModalTitle id={titleId}>{title}</ModalTitle>
        </ModalHeader>
        {ariaDescribedBy && (
          <ModalDescription id={describedById}>
            {ariaDescribedBy}
          </ModalDescription>
        )}
        {children}
      </ModalContent>
    </Modal>
  );
}
