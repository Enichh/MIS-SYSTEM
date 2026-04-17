import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActionConfirmation from './ActionConfirmation';

// Mock BaseModal
vi.mock('@/components/modals/BaseModal/BaseModal', () => ({
  default: ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
      </div>
    );
  },
}));

describe('ActionConfirmation', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <ActionConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
      />
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(
      <ActionConfirmation
        isOpen={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
      />
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should call onConfirm when Confirm button is clicked', () => {
    render(
      <ActionConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
      />
    );

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when Cancel button is clicked', () => {
    render(
      <ActionConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should use custom confirm and cancel text', () => {
    render(
      <ActionConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        title="Confirm Action"
        message="Are you sure?"
        confirmText="Yes, do it"
        cancelText="No, stop"
      />
    );

    expect(screen.getByText('Yes, do it')).toBeInTheDocument();
    expect(screen.getByText('No, stop')).toBeInTheDocument();
  });

  it('should apply danger variant styling', () => {
    render(
      <ActionConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        title="Dangerous Action"
        message="This is dangerous"
        variant="danger"
      />
    );

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('bg-red-600');
  });

  it('should apply warning variant styling', () => {
    render(
      <ActionConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        title="Warning"
        message="Proceed with caution"
        variant="warning"
      />
    );

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('bg-orange-500');
  });

  it('should apply info variant styling by default', () => {
    render(
      <ActionConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        title="Information"
        message="Please confirm"
        variant="info"
      />
    );

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('bg-blue-600');
  });

  it('should use default confirm and cancel text when not provided', () => {
    render(
      <ActionConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        title="Confirm Action"
        message="Are you sure?"
      />
    );

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});
