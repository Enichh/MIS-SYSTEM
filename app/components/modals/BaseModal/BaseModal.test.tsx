import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BaseModal from './BaseModal';
import type { ModalConfig } from '@/types';

// Mock HTML dialog methods since jsdom doesn't support them
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});

describe('BaseModal', () => {
  const defaultProps: ModalConfig = {
    isOpen: false,
    onClose: vi.fn(),
    title: 'Test Modal',
  };

  it('should not render dialog when isOpen is false', () => {
    render(<BaseModal {...defaultProps} />);
    const dialog = screen.queryByRole('dialog');
    expect(dialog).not.toBeInTheDocument();
  });

  it('should render dialog when isOpen is true', () => {
    render(<BaseModal {...defaultProps} isOpen={true} />);
    const dialog = screen.queryByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('should render title', () => {
    render(<BaseModal {...defaultProps} isOpen={true} />);
    const title = screen.getByText('Test Modal');
    expect(title).toBeInTheDocument();
  });

  it('should render close button when showCloseButton is true', () => {
    render(<BaseModal {...defaultProps} isOpen={true} showCloseButton={true} />);
    const closeButton = screen.getByLabelText('Close modal');
    expect(closeButton).toBeInTheDocument();
  });

  it('should not render close button when showCloseButton is false', () => {
    render(<BaseModal {...defaultProps} isOpen={true} showCloseButton={false} />);
    const closeButton = screen.queryByLabelText('Close modal');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<BaseModal {...defaultProps} isOpen={true} onClose={onClose} />);
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Note: ESC key behavior is tested by browser, not jsdom
  // The component uses native dialog 'cancel' event which is browser-specific

  it('should have correct aria attributes', () => {
    render(<BaseModal {...defaultProps} isOpen={true} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should render children', () => {
    render(
      <BaseModal {...defaultProps} isOpen={true}>
        <div>Modal Content</div>
      </BaseModal>
    );
    const content = screen.getByText('Modal Content');
    expect(content).toBeInTheDocument();
  });
});
