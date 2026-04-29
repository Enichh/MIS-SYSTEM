"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Task, Project, SearchQuery, Employee } from "@/types";
import { Button } from "@/app/components/ui/Button/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/app/components/ui/Card/Card";
import { Badge } from "@/app/components/ui/Badge/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/Select/Select";
import { SearchBar } from "@/app/components/SearchBar/SearchBar";
import { useConfirmation } from "@/lib/context/ConfirmationContext";
import TaskForm, {
  type TaskFormRef,
} from "@/app/components/forms/TaskForm/TaskForm";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

interface TaskListProps {
  isActive?: boolean;
}

export default function TaskList({ isActive = true }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [aiTaskQuery, setAiTaskQuery] = useState<string>("");
  const [aiFiltering, setAiFiltering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recommendationReasoning, setRecommendationReasoning] =
    useState<string>("");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const { confirm } = useConfirmation();
  const taskFormRef = useRef<TaskFormRef>(null);

  const buildTasksUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("name", searchQuery);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (priorityFilter !== "all") params.append("priority", priorityFilter);
    if (projectFilter !== "all") params.append("projectid", projectFilter);
    params.append("page", currentPage.toString());
    params.append("limit", "10");

    return params.toString()
      ? `/api/tasks?${params.toString()}`
      : "/api/tasks?page=1&limit=10";
  }, [
    searchQuery,
    statusFilter,
    priorityFilter,
    projectFilter,
    currentPage,
  ]);

  const { data: tasksData, error: tasksError, isLoading: tasksLoading } = useSWR(
    isActive && !aiFiltering ? buildTasksUrl() : null,
    fetcher,
    { dedupingInterval: 2000, revalidateOnFocus: false }
  );

  const { data: projectsData, error: projectsError, isLoading: projectsLoading } = useSWR(
    isActive ? "/api/projects?limit=100" : null,
    fetcher,
    { dedupingInterval: 60000, revalidateOnFocus: false }
  );

  const { data: employeesData, error: employeesError, isLoading: employeesLoading } = useSWR(
    isActive ? "/api/employees?limit=100" : null,
    fetcher,
    { dedupingInterval: 60000, revalidateOnFocus: false }
  );

  const { mutate: globalMutate } = useSWRConfig();

  useEffect(() => {
    setLoading(tasksLoading || projectsLoading || employeesLoading);
  }, [tasksLoading, projectsLoading, employeesLoading]);

  useEffect(() => {
    if (tasksData && !aiFiltering) {
      setTasks(tasksData.data || tasksData);
      setTotalPages(tasksData.pagination?.totalPages || 1);
      setTotal(tasksData.pagination?.total || 0);
    }
  }, [tasksData, aiFiltering]);

  useEffect(() => {
    if (projectsData) {
      setProjects(projectsData.data || projectsData);
    }
  }, [projectsData]);

  useEffect(() => {
    if (employeesData) {
      setEmployees(employeesData.data || employeesData);
    }
  }, [employeesData]);

  useEffect(() => {
    const fetchError = tasksError || projectsError || employeesError;
    if (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load tasks data");
    } else {
      setError(null);
    }
  }, [tasksError, projectsError, employeesError]);

  const invalidateCache = useCallback(() => {
    globalMutate((key) => typeof key === "string" && key.startsWith("/api/tasks"));
  }, [globalMutate]);

  const handleSearch = useCallback((query: SearchQuery) => {
    setSearchQuery(query.query);
    setCurrentPage(1);
  }, []);

  const uniqueEmployees = useMemo(() => {
    return employees
      .map((e) => ({ id: e.id, name: e.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const uniqueProjects = useMemo(() => {
    return projects
      .map((p) => ({ id: p.id, name: p.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  const handleAiTaskFilter = useCallback(async () => {
    if (!aiTaskQuery.trim()) return;

    try {
      setAiFiltering(true);
      const response = await fetch("/api/tasks/ai-filter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: aiTaskQuery,
          page: currentPage,
          limit: 10,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to filter tasks by AI");
      }

      const data = await response.json();
      setTasks(data.data || data);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to filter tasks by AI",
      );
    } finally {
      setAiFiltering(false);
    }
  }, [aiTaskQuery, currentPage]);

  const handleTaskRecommendation = useCallback(async () => {
    try {
      setLoadingRecommendations(true);
      const response = await fetch("/api/tasks/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context:
            "Recommend tasks to prioritize based on current workload and deadlines",
          type: "priority",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get task recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setRecommendationReasoning(data.reasoning || "");
      setShowRecommendations(true);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to get task recommendations",
      );
    } finally {
      setLoadingRecommendations(false);
    }
  }, []);

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  const handleDeleteClick = (task: Task) => {
    confirm({
      title: "Delete Task",
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      variant: "danger",
      confirmText: "Delete",
      onConfirm: async () => {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete task");
        }

        invalidateCache();
      }
    });
  };

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Loading Tasks...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <h3>Error Loading Tasks</h3>
        <p>Failed to load tasks. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <>
      <div className="task-filters">
        <SearchBar
          entityType="tasks"
          onSearch={handleSearch}
          placeholder="Search tasks by title..."
          ariaLabel="Search tasks"
        />
        <div className="task-filter-dropdowns">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              className="filter-select"
              aria-label="Filter by status"
            >
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(value) => {
              setPriorityFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              className="filter-select"
              aria-label="Filter by priority"
            >
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={projectFilter}
            onValueChange={(value) => {
              setProjectFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              className="filter-select"
              aria-label="Filter by project"
            >
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {uniqueProjects.map((proj) => (
                <SelectItem key={proj.id} value={proj.id}>
                  {proj.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ai-task-filter">
          <input
            type="text"
            className="ai-skill-input"
            placeholder="Describe task requirements (e.g., 'high priority tasks for John due this week')"
            value={aiTaskQuery}
            onChange={(e) => setAiTaskQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAiTaskFilter()}
            aria-label="AI task filter query"
          />
          <Button
            onClick={handleAiTaskFilter}
            disabled={aiFiltering || !aiTaskQuery.trim()}
            variant="primary"
          >
            {aiFiltering ? "Filtering..." : "AI Filter"}
          </Button>
        </div>
        <Button
          onClick={handleTaskRecommendation}
          disabled={loadingRecommendations}
          variant="secondary"
          className="recommendation-trigger"
        >
          {loadingRecommendations ? "Loading..." : "Get Recommendations"}
        </Button>
      </div>
      {showRecommendations && recommendations.length > 0 && (
        <div className="recommendation-banner">
          <div className="recommendation-header">
            <h4>Recommended Tasks</h4>
            <Button
              variant="ghost"
              onClick={() => setShowRecommendations(false)}
              aria-label="Close recommendations"
            >
              ✕
            </Button>
          </div>
          <p className="recommendation-reasoning">{recommendationReasoning}</p>
          <div className="recommendation-list">
            {recommendations.map((taskId) => {
              const task = tasks.find((t) => t.id === taskId);
              return task ? (
                <div key={taskId} className="recommendation-item">
                  <span className="recommendation-item-name">{task.title}</span>
                  <Badge
                    variant={
                      task.priority === "high"
                        ? "default"
                        : task.priority === "medium"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {task.priority}
                  </Badge>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
      {!tasks || tasks.length === 0 ? (
        <div className="empty-state">
          <h3>No Tasks Found</h3>
          <p>Click &quot;Add Task&quot; to create your first task.</p>
        </div>
      ) : (
        <>
          <div className="grid-layout">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex-between-start">
                    <div className="flex-1">
                      <CardTitle>{task.title}</CardTitle>
                      <CardDescription>
                        {projectMap.get(task.projectid) || "Unknown Project"}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        task.status === "completed"
                          ? "default"
                          : task.status === "in_progress"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {task.status
                        .replace("_", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {task.description && (
                    <p className="text-sm">
                      <span className="font-semibold">Description:</span>{" "}
                      {task.description}
                    </p>
                  )}
                  {task.assignedto && (
                    <p className="text-sm">
                      <span className="font-semibold">Assigned To:</span>{" "}
                      {task.assignedto}
                    </p>
                  )}
                  {task.duedate && (
                    <p className="text-sm">
                      <span className="font-semibold">Due Date:</span>{" "}
                      {task.duedate}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex-between-end">
                  <Button
                    variant="secondary"
                    icon="edit"
                    onClick={() => taskFormRef.current?.open(task)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    icon="trash"
                    onClick={() => handleDeleteClick(task)}
                  >
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination-controls">
              <Button
                variant="secondary"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages} ({total} total)
              </span>
              <Button
                variant="secondary"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
      <TaskForm ref={taskFormRef} onSuccess={invalidateCache} />
    </>
  );
}
