'use client';

import { ModalConfig, ModalSize } from '@/types';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '../../ui/Modal/Modal';

interface BaseModalProps extends ModalConfig {
  children?: React.ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-xs',
  md: 'max-w-sm',
  lg: 'max-w-md',
  xl: 'max-w-lg',
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
      <ModalContent className={sizeClasses[size]} aria-describedby={ariaDescribedBy ? describedById : undefined}>
        <ModalHeader>
          <ModalTitle id={titleId}>{title}</ModalTitle>
        </ModalHeader>
        {children}
      </ModalContent>
    </Modal>
  );
}
