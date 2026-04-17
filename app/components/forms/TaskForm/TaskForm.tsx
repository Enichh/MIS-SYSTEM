'use client';

import BaseModal from '@/app/components/modals/BaseModal/BaseModal';
import { useModal } from '@/lib/hooks/useModal';
import { useForm } from '@/lib/hooks/useForm';
import { TASK_STATUS, TASK_PRIORITY } from '@/lib/constants';
import type { FormFieldConfig } from '@/types';

const taskFields: FormFieldConfig[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 100 },
  { name: 'description', label: 'Description', type: 'textarea', required: false, maxLength: 1000 },
  { name: 'status', label: 'Status', type: 'select', required: true, options: [...TASK_STATUS] },
  { name: 'priority', label: 'Priority', type: 'select', required: true, options: [...TASK_PRIORITY] },
  { name: 'projectId', label: 'Project ID', type: 'text', required: true, maxLength: 50 },
  { name: 'assignedTo', label: 'Assigned To (Employee ID)', type: 'text', required: false, maxLength: 50 },
  { name: 'dueDate', label: 'Due Date', type: 'date', required: false },
];

interface FormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  projectId: string;
  assignedTo: string;
  dueDate: string;
}

export default function TaskForm() {
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
    fields: taskFields,
    initialValues: {
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      projectId: '',
      assignedTo: '',
      dueDate: '',
    },
    onSubmit: async (data) => {
      const payload = {
        ...data,
        assignedTo: data.assignedTo || null,
        dueDate: data.dueDate || undefined,
        dependencies: [],
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create task');
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
      <button onClick={handleOpen} className="btn-primary" aria-label="Add new task">
        Add Task
      </button>

      <BaseModal
        isOpen={isOpen}
        onClose={close}
        title="Add Task"
        size="md"
        ariaDescribedBy="task-form-description"
      >
        <p id="task-form-description" className="sr-only">
          Fill in the form below to add a new task to the system.
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
          {taskFields.map((field) => (
            <div key={field.name} className="mb-4">
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name as keyof FormData] as string}
                  onChange={handleInputChange}
                  required={field.required}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                  aria-invalid={!!errors[field.name]}
                />
              ) : field.type === 'select' ? (
                <select
                  id={field.name}
                  name={field.name}
                  value={formData[field.name as keyof FormData] as string}
                  onChange={handleInputChange}
                  required={field.required}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                  aria-invalid={!!errors[field.name]}
                >
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  value={formData[field.name as keyof FormData] as string}
                  onChange={handleInputChange}
                  required={field.required}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                  aria-invalid={!!errors[field.name]}
                />
              )}
              {errors[field.name] && (
                <p id={`${field.name}-error`} className="mt-1 text-sm text-red-600" role="alert">
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
              aria-label="Submit task form"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </BaseModal>
    </>
  );
}
