"use client";

import {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import BaseModal from "@/app/components/modals/BaseModal/BaseModal";
import { useModal } from "@/lib/hooks/useModal";
import { useForm } from "@/lib/hooks/useForm";
import { TASK_STATUS, TASK_PRIORITY } from "@/lib/constants";
import { Button } from "@/app/components/ui/Button/Button";
import { Input } from "@/app/components/ui/Input/Input";
import { Textarea } from "@/app/components/ui/Textarea/Textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/Select/Select";
import type { FormFieldConfig, Project, Employee, Task } from "@/types";

const taskFields: FormFieldConfig[] = [
  {
    name: "title",
    label: "Title",
    type: "text",
    required: true,
    maxLength: 100,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    required: false,
    maxLength: 1000,
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: [...TASK_STATUS],
  },
  {
    name: "priority",
    label: "Priority",
    type: "select",
    required: true,
    options: [...TASK_PRIORITY],
  },
  {
    name: "projectId",
    label: "Assign to Project",
    type: "searchable",
    required: true,
    options: [],
  },
  {
    name: "assignedTo",
    label: "Assign to Employee",
    type: "searchable",
    required: false,
    options: [],
  },
  { name: "dueDate", label: "Due Date", type: "date", required: false },
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
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendationReason, setRecommendationReason] = useState<string>("");
  const employeeDropdownRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, employeesRes] = await Promise.all([
          fetch("/api/projects?limit=100"),
          fetch("/api/employees?limit=100"),
        ]);

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          console.log("[TASKFORM] Projects API response:", projectsData);
          setProjects(projectsData.data || []);
        } else {
          console.error(
            "[TASKFORM] Projects API error:",
            projectsRes.status,
            projectsRes.statusText,
          );
        }

        if (employeesRes.ok) {
          const employeesData = await employeesRes.json();
          console.log("[TASKFORM] Employees API response:", employeesData);
          setEmployees(employeesData.data || []);
        } else {
          console.error(
            "[TASKFORM] Employees API error:",
            employeesRes.status,
            employeesRes.statusText,
          );
        }
      } catch (error) {
        console.error("[TASKFORM] Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  const dynamicTaskFields: FormFieldConfig[] = taskFields.map((field) => {
    if (field.name === "projectId") {
      return {
        ...field,
        options: projects.map((p) => p.id),
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
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      projectId: "",
      assignedTo: "",
      dueDate: "",
    },
    onSubmit: async (data) => {
      const payload = {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        projectid: data.projectId,
        assignedto: data.assignedTo || null,
        duedate: data.dueDate || undefined,
        dependencies: [],
      };

      const isEditing = editingTask !== null;
      const url = isEditing ? `/api/tasks/${editingTask.id}` : "/api/tasks";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || `Failed to ${isEditing ? "update" : "create"} task`,
        );
      }
    },
    onSuccess: () => {
      setTimeout(() => {
        close();
        window.location.reload();
      }, 1500);
    },
  });

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.email.toLowerCase().includes(employeeSearch.toLowerCase()),
  );

  const filteredProjects = projects.filter(
    (proj) =>
      proj.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      proj.description?.toLowerCase().includes(projectSearch.toLowerCase()),
  );

  const open = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      // Pre-populate form with task data
      const initialData = {
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        projectId: task.projectid,
        assignedTo: task.assignedto || "",
        dueDate: task.duedate || "",
      };
      // Need to reset form with this data
      Object.keys(initialData).forEach((key) => {
        const event = {
          target: {
            name: key,
            value: initialData[key as keyof typeof initialData],
          },
        } as React.ChangeEvent<HTMLInputElement>;
        handleInputChange(event);
      });
      // Set employee search if assigned
      if (task.assignedto) {
        const employee = employees.find((e) => e.id === task.assignedto);
        if (employee) {
          setEmployeeSearch(employee.name);
        }
      } else {
        setEmployeeSearch("");
      }
      // Set project search if assigned
      if (task.projectid) {
        const project = projects.find((p) => p.id === task.projectid);
        if (project) {
          setProjectSearch(project.name);
        }
      } else {
        setProjectSearch("");
      }
    } else {
      setEditingTask(null);
      resetForm();
      setEmployeeSearch("");
      setProjectSearch("");
    }
    openModal();
  };

  useImperativeHandle(ref, () => ({
    open,
    close,
  }));

  useEffect(() => {
    if (formData.assignedTo) {
      const employee = employees.find((e) => e.id === formData.assignedTo);
      if (employee) {
        setEmployeeSearch(employee.name);
      }
    } else {
      setEmployeeSearch("");
      setRecommendationReason("");
    }
  }, [formData.assignedTo, employees]);

  useEffect(() => {
    if (formData.projectId) {
      const project = projects.find((p) => p.id === formData.projectId);
      if (project) {
        setProjectSearch(project.name);
      }
    } else {
      setProjectSearch("");
    }
  }, [formData.projectId, projects]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        employeeDropdownRef.current &&
        !employeeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowEmployeeDropdown(false);
      }
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProjectDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (recommendationReason) {
      const timer = setTimeout(() => {
        setRecommendationReason("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [recommendationReason]);

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "Select a project";
  };

  const recommendEmployees = async () => {
    setIsRecommending(true);
    try {
      const response = await fetch("/api/employees/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: formData.title,
          taskDescription: formData.description,
          projectId: formData.projectId,
          priority: formData.priority,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.recommendations && data.recommendations.length > 0) {
          const topRecommendation = data.recommendations[0];
          setEmployeeSearch(topRecommendation.name);
          setRecommendationReason(topRecommendation.reason || "");
          const event = {
            target: { name: "assignedTo", value: topRecommendation.id },
          } as React.ChangeEvent<HTMLInputElement>;
          handleInputChange(event);
        }
      }
    } catch (error) {
      console.error("Failed to get recommendations:", error);
    } finally {
      setIsRecommending(false);
    }
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={close}
        title={editingTask ? "Edit Task" : "Add Task"}
        size="md"
        ariaDescribedBy="task-form-description"
      >
        <p id="task-form-description" className="sr-only">
          Fill in the form below to add a new task to the system.
        </p>

        {notification && (
          <div
            className={`notification ${
              notification.type === "success"
                ? "notification-success"
                : "notification-error"
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
              {field.type === "textarea" ? (
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name as keyof FormData] as string}
                  onChange={handleInputChange}
                  required={field.required}
                  rows={3}
                  className={errors[field.name] ? "border-destructive" : ""}
                  aria-describedby={
                    errors[field.name] ? `${field.name}-error` : undefined
                  }
                  aria-invalid={!!errors[field.name]}
                />
              ) : field.type === "select" ? (
                <Select
                  value={formData[field.name as keyof FormData] || ""}
                  onValueChange={(value) => {
                    handleInputChange({
                      target: { name: field.name, value },
                    } as React.ChangeEvent<HTMLInputElement>);
                  }}
                >
                  <SelectTrigger
                    className={errors[field.name] ? "border-destructive" : ""}
                  >
                    <SelectValue>
                      {field.name === "projectId"
                        ? getProjectName(formData.projectId)
                        : field.name === "status"
                          ? formData.status.charAt(0).toUpperCase() +
                            formData.status.slice(1)
                          : field.name === "priority"
                            ? formData.priority.charAt(0).toUpperCase() +
                              formData.priority.slice(1)
                            : `Select ${field.label.toLowerCase()}`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {field.name === "projectId"
                      ? projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))
                      : field.options?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              ) : field.type === "searchable" ? (
                <div
                  className="relative"
                  ref={
                    field.name === "projectId"
                      ? projectDropdownRef
                      : employeeDropdownRef
                  }
                >
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      id={field.name}
                      name={field.name}
                      value={
                        field.name === "projectId"
                          ? projectSearch
                          : employeeSearch
                      }
                      onChange={(e) => {
                        if (field.name === "projectId") {
                          setProjectSearch(e.target.value);
                          setShowProjectDropdown(true);
                        } else {
                          setEmployeeSearch(e.target.value);
                          setShowEmployeeDropdown(true);
                        }
                      }}
                      onFocus={() => {
                        if (field.name === "projectId") {
                          setShowProjectDropdown(true);
                        } else {
                          setShowEmployeeDropdown(true);
                        }
                      }}
                      placeholder={
                        field.name === "projectId"
                          ? "Search project by name or description..."
                          : "Search employee by name or email..."
                      }
                      state={errors[field.name] ? "error" : "default"}
                      aria-describedby={
                        errors[field.name] ? `${field.name}-error` : undefined
                      }
                      aria-invalid={!!errors[field.name]}
                    />
                    {field.name === "assignedTo" && (
                      <button
                        type="button"
                        onClick={recommendEmployees}
                        disabled={isRecommending || !formData.title}
                        className="recommend-button"
                        title="AI Recommend Employee"
                        aria-label="Get AI employee recommendation"
                      >
                        {isRecommending ? (
                          <span className="recommend-spinner">⏳</span>
                        ) : (
                          <span className="recommend-star">⭐</span>
                        )}
                      </button>
                    )}
                  </div>
                  {field.name === "projectId" ? (
                    <>
                      {showProjectDropdown &&
                        projectSearch &&
                        filteredProjects.length > 0 && (
                          <ul className="dropdown-list">
                            {filteredProjects.map((proj) => (
                              <li
                                key={proj.id}
                                onClick={() => {
                                  setProjectSearch(proj.name);
                                  setShowProjectDropdown(false);
                                  const event = {
                                    target: {
                                      name: field.name,
                                      value: proj.id,
                                    },
                                  } as React.ChangeEvent<HTMLInputElement>;
                                  handleInputChange(event);
                                }}
                                className="dropdown-item-custom"
                              >
                                <div className="dropdown-item-name">
                                  {proj.name}
                                </div>
                                {proj.description && (
                                  <div className="dropdown-item-email">
                                    {proj.description}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      {showProjectDropdown &&
                        projectSearch &&
                        filteredProjects.length === 0 && (
                          <p className="no-results mt-1">No projects found</p>
                        )}
                    </>
                  ) : (
                    <>
                      {showEmployeeDropdown &&
                        employeeSearch &&
                        filteredEmployees.length > 0 && (
                          <ul className="dropdown-list">
                            {filteredEmployees.map((emp) => (
                              <li
                                key={emp.id}
                                onClick={() => {
                                  setEmployeeSearch(emp.name);
                                  setShowEmployeeDropdown(false);
                                  const event = {
                                    target: { name: field.name, value: emp.id },
                                  } as React.ChangeEvent<HTMLInputElement>;
                                  handleInputChange(event);
                                }}
                                className="dropdown-item-custom"
                              >
                                <div className="dropdown-item-name">
                                  {emp.name}
                                </div>
                                <div className="dropdown-item-email">
                                  {emp.email}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      {showEmployeeDropdown &&
                        employeeSearch &&
                        filteredEmployees.length === 0 && (
                          <p className="no-results mt-1">No employees found</p>
                        )}
                    </>
                  )}
                  {field.name === "assignedTo" && recommendationReason && (
                    <div className="recommendation-reason">
                      <div className="recommendation-reason-header">
                        Why this employee?
                      </div>
                      <div className="recommendation-reason-text">
                        {recommendationReason}
                      </div>
                    </div>
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
                  state={errors[field.name] ? "error" : "default"}
                  aria-describedby={
                    errors[field.name] ? `${field.name}-error` : undefined
                  }
                  aria-invalid={!!errors[field.name]}
                />
              )}
              {errors[field.name] && (
                <p
                  id={`${field.name}-error`}
                  className="form-error"
                  role="alert"
                >
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
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </BaseModal>
    </>
  );
});

TaskForm.displayName = "TaskForm";

export default TaskForm;
