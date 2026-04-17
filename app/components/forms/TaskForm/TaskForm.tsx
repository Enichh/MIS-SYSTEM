'use client';

import { useState, useEffect } from 'react';
import BaseModal from '@/app/components/modals/BaseModal/BaseModal';
import { useModal } from '@/lib/hooks/useModal';
import { useForm } from '@/lib/hooks/useForm';
import { TASK_STATUS, TASK_PRIORITY } from '@/lib/constants';
import type { FormFieldConfig, Project, Employee } from '@/types';

const taskFields: FormFieldConfig[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 100 },
  { name: 'description', label: 'Description', type: 'textarea', required: false, maxLength: 1000 },
  { name: 'status', label: 'Status', type: 'select', required: true, options: [...TASK_STATUS] },
  { name: 'priority', label: 'Priority', type: 'select', required: true, options: [...TASK_PRIORITY] },
  { name: 'projectId', label: 'Assign to Project', type: 'select', required: true, options: [] },
  { name: 'assignedTo', label: 'Assign to Employee', type: 'searchable', required: false, options: [] },
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, employeesRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/employees'),
        ]);

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData);
        }

        if (employeesRes.ok) {
          const employeesData = await employeesRes.json();
          setEmployees(employeesData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  const dynamicTaskFields: FormFieldConfig[] = taskFields.map(field => {
    if (field.name === 'projectId') {
      return {
        ...field,
        options: projects.map(p => `${p.id}|${p.name}`),
      };
    }
    if (field.name === 'assignedTo') {
      return {
        ...field,
        options: employees.map(e => `${e.id}|${e.name}`),
      };
    }
    return field;
  });

  const {
    formData,
    errors,
    isSubmitting,
    notification,
    handleInputChange,
    handleSubmit,
    resetForm,
  } = useForm<FormData>({
    fields: dynamicTaskFields,
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

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.email.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const handleOpen = () => {
    resetForm();
    setEmployeeSearch('');
    open();
  };

  useEffect(() => {
    if (formData.assignedTo) {
      const employee = employees.find(e => e.id === formData.assignedTo);
      if (employee) {
        setEmployeeSearch(employee.name);
      }
    } else {
      setEmployeeSearch('');
    }
  }, [formData.assignedTo, employees]);

  const getDisplayValue = (value: string, fieldName: string) => {
    if (fieldName === 'projectId') {
      const project = projects.find(p => p.id === value);
      return project ? `${project.id}|${project.name}` : value;
    }
    if (fieldName === 'assignedTo') {
      const employee = employees.find(e => e.id === value);
      return employee ? `${employee.id}|${employee.name}` : value;
    }
    return value;
  };

  const extractId = (value: string) => {
    return value.split('|')[0];
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
          {dynamicTaskFields.map((field) => (
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
              ) : field.type === 'select' ? (
                <select
                  id={field.name}
                  name={field.name}
                  value={field.name === 'projectId' ? getDisplayValue(formData[field.name as keyof FormData] as string, field.name) : formData[field.name as keyof FormData] as string}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    if (field.name === 'projectId') {
                      const event = { target: { name: field.name, value: extractId(e.target.value) } } as React.ChangeEvent<HTMLInputElement>;
                      handleInputChange(event);
                    } else {
                      const event = { target: { name: field.name, value: e.target.value } } as React.ChangeEvent<HTMLInputElement>;
                      handleInputChange(event);
                    }
                  }}
                  required={field.required}
                  className={`form-select ${errors[field.name] ? 'error' : ''}`}
                  aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                  aria-invalid={!!errors[field.name]}
                >
                  <option value="">
                    {field.name === 'projectId' ? 'Select a project' : field.name === 'status' ? 'Select a status' : field.name === 'priority' ? 'Select a priority' : 'Select an option'}
                  </option>
                  {field.options?.map((option) => {
                    if (field.name === 'projectId') {
                      const [id, name] = option.split('|');
                      return (
                        <option key={id} value={option}>
                          {name}
                        </option>
                      );
                    }
                    return (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    );
                  })}
                </select>
              ) : field.type === 'searchable' ? (
                <div className="searchable-dropdown">
                  <input
                    type="text"
                    id={field.name}
                    name={field.name}
                    value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                    }}
                    placeholder="Search employee by name or email..."
                    className={`form-input ${errors[field.name] ? 'error' : ''}`}
                    aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                    aria-invalid={!!errors[field.name]}
                  />
                  {employeeSearch && filteredEmployees.length > 0 && (
                    <ul className="dropdown-list">
                      {filteredEmployees.map((emp) => (
                        <li
                          key={emp.id}
                          onClick={() => {
                            setEmployeeSearch(emp.name);
                            const event = { target: { name: field.name, value: emp.id } } as React.ChangeEvent<HTMLInputElement>;
                            handleInputChange(event);
                          }}
                          className="dropdown-item"
                        >
                          <div className="employee-name">{emp.name}</div>
                          <div className="employee-email">{emp.email}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {employeeSearch && filteredEmployees.length === 0 && (
                    <p className="no-results">No employees found</p>
                  )}
                </div>
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
