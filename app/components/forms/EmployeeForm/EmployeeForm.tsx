'use client';

import { useImperativeHandle, forwardRef, useState } from 'react';
import BaseModal from '@/app/components/modals/BaseModal/BaseModal';
import { useModal } from '@/lib/hooks/useModal';
import { useForm } from '@/lib/hooks/useForm';
import { Button } from '@/app/components/ui/Button/Button';
import { Input } from '@/app/components/ui/Input/Input';
import { Textarea } from '@/app/components/ui/Textarea/Textarea';
import type { FormFieldConfig, Employee } from '@/types';

const employeeFields: FormFieldConfig[] = [
  { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 100 },
  { name: 'email', label: 'Email', type: 'email', required: true, maxLength: 255 },
  { name: 'role', label: 'Role', type: 'text', required: true, maxLength: 50 },
  { name: 'department', label: 'Department', type: 'text', required: true, maxLength: 50 },
  { name: 'skills', label: 'Skills (comma-separated)', type: 'text', required: false, maxLength: 500 },
];

interface FormData {
  name: string;
  email: string;
  role: string;
  department: string;
  skills: string;
}

export interface EmployeeFormRef {
  open: (employee?: Employee) => void;
  close: () => void;
}

const EmployeeForm = forwardRef<EmployeeFormRef, {}>((_, ref) => {
  const { isOpen, open: openModal, close } = useModal();
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const {
    formData,
    errors,
    isSubmitting,
    notification,
    handleInputChange,
    handleSubmit,
    resetForm,
  } = useForm<FormData>({
    fields: employeeFields,
    initialValues: {
      name: '',
      email: '',
      role: '',
      department: '',
      skills: '',
    },
    onSubmit: async (data) => {
      const payload = {
        ...data,
        skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter((s) => s) : [],
      };

      const isEditing = editingEmployee !== null;
      const url = isEditing ? `/api/employees/${editingEmployee.id}` : '/api/employees';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${isEditing ? 'update' : 'create'} employee`);
      }
    },
    onSuccess: () => {
      setTimeout(() => {
        close();
        window.location.reload();
      }, 1500);
    },
  });

  const open = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      // Pre-populate form with employee data
      const eventData = {
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        skills: employee.skills ? employee.skills.join(', ') : '',
      };
      Object.keys(eventData).forEach(key => {
        const event = { target: { name: key, value: eventData[key as keyof typeof eventData] } } as React.ChangeEvent<HTMLInputElement>;
        handleInputChange(event);
      });
    } else {
      setEditingEmployee(null);
      resetForm();
    }
    openModal();
  };

  useImperativeHandle(ref, () => ({
    open,
    close,
  }));

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={close}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        size="md"
        ariaDescribedBy="employee-form-description"
      >
        <p id="employee-form-description" className="sr-only">
          Fill in the form below to add a new employee to the system.
        </p>

        {notification && (
          <div
            className={`notification ${
              notification.type === 'success' ? 'notification-success' : 'notification-error'
            }`}
            role="alert"
          >
            {notification.message}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {employeeFields.map((field) => (
            <div key={field.name} className="form-field">
              <label htmlFor={field.name} className="form-label">
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name as keyof FormData] as string}
                  onChange={handleInputChange}
                  required={field.required}
                  rows={3}
                  className={errors[field.name] ? 'border-destructive' : ''}
                  aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                  aria-invalid={!!errors[field.name]}
                />
              ) : (
                <Input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  value={formData[field.name as keyof FormData] as string}
                  onChange={handleInputChange}
                  required={field.required}
                  state={errors[field.name] ? 'error' : 'default'}
                  aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                  aria-invalid={!!errors[field.name]}
                />
              )}
              {errors[field.name] && (
                <p id={`${field.name}-error`} className="form-error" role="alert">
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={close}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              aria-label="Submit employee form"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </BaseModal>
    </>
  );
});

EmployeeForm.displayName = 'EmployeeForm';

export default EmployeeForm;
