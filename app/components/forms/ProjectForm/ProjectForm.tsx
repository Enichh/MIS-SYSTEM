'use client';

import BaseModal from '@/app/components/modals/BaseModal/BaseModal';
import { useModal } from '@/lib/hooks/useModal';
import { useForm } from '@/lib/hooks/useForm';
import { PROJECT_STATUS, PROJECT_PRIORITY } from '@/lib/constants';
import { Button } from '@/app/components/ui/Button/Button';
import { Input } from '@/app/components/ui/Input/Input';
import { Textarea } from '@/app/components/ui/Textarea/Textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/components/ui/Select/Select';
import type { FormFieldConfig } from '@/types';

const projectFields: FormFieldConfig[] = [
  { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 100 },
  { name: 'description', label: 'Description', type: 'textarea', required: false, maxLength: 1000 },
  { name: 'status', label: 'Status', type: 'select', required: true, options: [...PROJECT_STATUS] },
  { name: 'priority', label: 'Priority', type: 'select', required: true, options: [...PROJECT_PRIORITY] },
  { name: 'progress', label: 'Progress (%)', type: 'number', required: true, min: 0, max: 100 },
  { name: 'startDate', label: 'Start Date', type: 'date', required: false },
  { name: 'endDate', label: 'End Date', type: 'date', required: false },
];

interface FormData {
  name: string;
  description: string;
  status: string;
  priority: string;
  progress: string;
  startDate: string;
  endDate: string;
}

export default function ProjectForm() {
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
    fields: projectFields,
    initialValues: {
      name: '',
      description: '',
      status: 'active',
      priority: 'medium',
      progress: '0',
      startDate: '',
      endDate: '',
    },
    onSubmit: async (data) => {
      const payload = {
        ...data,
        progress: parseInt(data.progress, 10),
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create project');
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
      <Button onClick={handleOpen} icon="plus" aria-label="Add new project">
        Add Project
      </Button>

      <BaseModal
        isOpen={isOpen}
        onClose={close}
        title="Add Project"
        size="md"
        ariaDescribedBy="project-form-description"
      >
        <p id="project-form-description" className="sr-only">
          Fill in the form below to add a new project to the system.
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
          {projectFields.map((field) => (
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
              ) : field.type === 'select' ? (
                <Select
                  value={formData[field.name as keyof FormData] as string}
                  onValueChange={(value) => {
                    const event = { target: { name: field.name, value } } as React.ChangeEvent<HTMLInputElement>;
                    handleInputChange(event);
                  }}
                  required={field.required}
                >
                  <SelectTrigger className={errors[field.name] ? 'border-destructive' : ''}>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  value={formData[field.name as keyof FormData] as string}
                  onChange={handleInputChange}
                  required={field.required}
                  min={field.min}
                  max={field.max}
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
              aria-label="Submit project form"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </BaseModal>
    </>
  );
}
