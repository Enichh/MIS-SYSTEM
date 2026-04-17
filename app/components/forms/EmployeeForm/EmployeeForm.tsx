'use client';

import BaseModal from '@/app/components/modals/BaseModal/BaseModal';
import { useModal } from '@/lib/hooks/useModal';
import { useForm } from '@/lib/hooks/useForm';
import type { FormFieldConfig } from '@/types';

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

export default function EmployeeForm() {
  const { isOpen, open, close } = useModal();

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

      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create employee');
      }
    },
    onSuccess: () => {
      setTimeout(() => {
        close();
        window.location.reload();
      }, 1500);
    },
  });

  const handleOpen = () => {
    resetForm();
    open();
  };

  return (
    <>
      <button onClick={handleOpen} className="btn-primary" aria-label="Add new employee">
        Add Employee
      </button>

      <BaseModal
        isOpen={isOpen}
        onClose={close}
        title="Add Employee"
        size="md"
        ariaDescribedBy="employee-form-description"
      >
        <p id="employee-form-description" className="sr-only">
          Fill in the form below to add a new employee to the system.
        </p>

        {notification && (
          <div
            className={`mb-4 p-3 rounded-md ${
              notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
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
                <textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name as keyof FormData] as string}
                  onChange={handleInputChange}
                  required={field.required}
                  rows={3}
                  className={`form-textarea ${errors[field.name] ? 'error' : ''}`}
                  aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                  aria-invalid={!!errors[field.name]}
                />
              ) : (
                <input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  value={formData[field.name as keyof FormData] as string}
                  onChange={handleInputChange}
                  required={field.required}
                  className={`form-input ${errors[field.name] ? 'error' : ''}`}
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
            <button
              type="button"
              onClick={close}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              aria-label="Submit employee form"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </BaseModal>
    </>
  );
}
