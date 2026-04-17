import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BaseModal from './BaseModal';
import type { ModalConfig } from '@/types';

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
