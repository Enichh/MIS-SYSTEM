import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteConfirmation from './DeleteConfirmation';

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

describe('DeleteConfirmation', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <DeleteConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        entityName="John Doe"
        entityType="Employee"
      />
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Delete Employee')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "John Doe"/)).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(
      <DeleteConfirmation
        isOpen={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        entityName="John Doe"
        entityType="Employee"
      />
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should call onConfirm when Delete button is clicked', () => {
    render(
      <DeleteConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        entityName="John Doe"
        entityType="Employee"
      />
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when Cancel button is clicked', () => {
    render(
      <DeleteConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        entityName="John Doe"
        entityType="Employee"
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should display correct entity name and type in message', () => {
    render(
      <DeleteConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        entityName="Test Project"
        entityType="Project"
      />
    );

    expect(screen.getByText('Delete Project')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "Test Project"/)).toBeInTheDocument();
  });

  it('should apply danger variant styling by default', () => {
    render(
      <DeleteConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        entityName="John Doe"
        entityType="Employee"
      />
    );

    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toHaveClass('bg-red-600');
  });

  it('should support warning variant', () => {
    render(
      <DeleteConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        entityName="John Doe"
        entityType="Employee"
        variant="warning"
      />
    );

    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toHaveClass('bg-orange-500');
  });

  it('should support info variant', () => {
    render(
      <DeleteConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        entityName="John Doe"
        entityType="Employee"
        variant="info"
      />
    );

    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toHaveClass('bg-blue-600');
  });
});
