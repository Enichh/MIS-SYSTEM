'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import BaseModal from '@/app/components/modals/BaseModal/BaseModal';
import { useModal } from '@/lib/hooks/useModal';
import { useForm } from '@/lib/hooks/useForm';
import { TASK_STATUS, TASK_PRIORITY } from '@/lib/constants';
import { Button } from '@/app/components/ui/Button/Button';
import { Input } from '@/app/components/ui/Input/Input';
import { Textarea } from '@/app/components/ui/Textarea/Textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/components/ui/Select/Select';
import type { FormFieldConfig, Project, Employee, Task } from '@/types';

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

export interface TaskFormRef {
  open: (task?: Task) => void;
  close: () => void;
}

const TaskForm = forwardRef<TaskFormRef, {}>((_, ref) => {
  const { isOpen, open: openModal, close } = useModal();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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

      const isEditing = editingTask !== null;
      const url = isEditing ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${isEditing ? 'update' : 'create'} task`);
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

  const open = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      // Pre-populate form with task data
      const initialData = {
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        projectId: task.projectId,
        assignedTo: task.assignedTo || '',
        dueDate: task.dueDate || '',
      };
      // Need to reset form with this data
      Object.keys(initialData).forEach(key => {
        const event = { target: { name: key, value: initialData[key as keyof typeof initialData] } } as React.ChangeEvent<HTMLInputElement>;
        handleInputChange(event);
      });
      // Set employee search if assigned
      if (task.assignedTo) {
        const employee = employees.find(e => e.id === task.assignedTo);
        if (employee) {
          setEmployeeSearch(employee.name);
        }
      } else {
        setEmployeeSearch('');
      }
    } else {
      setEditingTask(null);
      resetForm();
      setEmployeeSearch('');
    }
    openModal();
  };

  useImperativeHandle(ref, () => ({
    open,
    close,
  }));

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
      <BaseModal
        isOpen={isOpen}
        onClose={close}
        title={editingTask ? 'Edit Task' : 'Add Task'}
        size="md"
        ariaDescribedBy="task-form-description"
      >
        <p id="task-form-description" className="sr-only">
          Fill in the form below to add a new task to the system.
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
          {dynamicTaskFields.map((field) => (
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
                  value={field.name === 'projectId' ? getDisplayValue(formData[field.name as keyof FormData] as string, field.name) : formData[field.name as keyof FormData] as string}
                  onValueChange={(value) => {
                    if (field.name === 'projectId') {
                      const event = { target: { name: field.name, value: extractId(value) } } as React.ChangeEvent<HTMLInputElement>;
                      handleInputChange(event);
                    } else {
                      const event = { target: { name: field.name, value } } as React.ChangeEvent<HTMLInputElement>;
                      handleInputChange(event);
                    }
                  }}
                  required={field.required}
                >
                  <SelectTrigger className={errors[field.name] ? 'border-destructive' : ''}>
                    <SelectValue placeholder={field.name === 'projectId' ? 'Select a project' : field.name === 'status' ? 'Select a status' : field.name === 'priority' ? 'Select a priority' : 'Select an option'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => {
                      if (field.name === 'projectId') {
                        const [id, name] = option.split('|');
                        return (
                          <SelectItem key={id} value={option}>
                            {name}
                          </SelectItem>
                        );
                      }
                      return (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : field.type === 'searchable' ? (
                <div className="relative">
                  <Input
                    type="text"
                    id={field.name}
                    name={field.name}
                    value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                    }}
                    placeholder="Search employee by name or email..."
                    state={errors[field.name] ? 'error' : 'default'}
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
                          className="dropdown-item-custom"
                        >
                          <div className="dropdown-item-name">{emp.name}</div>
                          <div className="dropdown-item-email">{emp.email}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {employeeSearch && filteredEmployees.length === 0 && (
                    <p className="no-results mt-1">No employees found</p>
                  )}
                </div>
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
              aria-label="Submit task form"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </BaseModal>
    </>
  );
});

TaskForm.displayName = 'TaskForm';

export default TaskForm;
