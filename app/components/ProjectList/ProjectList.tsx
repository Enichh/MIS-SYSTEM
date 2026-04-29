"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Project, SearchQuery } from "@/types";
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
import { Progress } from "@/app/components/ui/Progress";
import { useConfirmation } from "@/lib/context/ConfirmationContext";
import { SearchBar } from "@/app/components/SearchBar/SearchBar";
import ProjectForm, {
  type ProjectFormRef,
} from "@/app/components/forms/ProjectForm/ProjectForm";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

interface ProjectListProps {
  isActive?: boolean;
}

export default function ProjectList({ isActive = true }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [progressMin, setProgressMin] = useState<string>("");
  const [progressMax, setProgressMax] = useState<string>("");
  const [aiProjectQuery, setAiProjectQuery] = useState<string>("");
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
  const projectFormRef = useRef<ProjectFormRef>(null);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("name", searchQuery);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (priorityFilter !== "all") params.append("priority", priorityFilter);
    if (progressMin) params.append("progressMin", progressMin);
    if (progressMax) params.append("progressMax", progressMax);
    params.append("page", currentPage.toString());
    params.append("limit", "10");

    return params.toString()
      ? `/api/projects?${params.toString()}`
      : "/api/projects?page=1&limit=10";
  }, [
    searchQuery,
    statusFilter,
    priorityFilter,
    progressMin,
    progressMax,
    currentPage,
  ]);

  const { data: swrData, error: swrError, isLoading: swrIsLoading } = useSWR(
    isActive && !aiFiltering ? buildUrl() : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  const { mutate: globalMutate } = useSWRConfig();

  useEffect(() => {
    setLoading(swrIsLoading);
  }, [swrIsLoading]);

  useEffect(() => {
    if (swrData && !aiFiltering) {
      setProjects(swrData.data || swrData);
      setTotalPages(swrData.pagination?.totalPages || 1);
      setTotal(swrData.pagination?.total || 0);
      setError(null);
    }
  }, [swrData, aiFiltering]);

  useEffect(() => {
    if (swrError) {
      setError(swrError instanceof Error ? swrError.message : "Failed to load projects");
    }
  }, [swrError]);

  const invalidateCache = useCallback(() => {
    globalMutate((key) => typeof key === "string" && key.startsWith("/api/projects"));
  }, [globalMutate]);

  const handleSearch = useCallback((query: SearchQuery) => {
    setSearchQuery(query.query);
    setCurrentPage(1);
  }, []);

  const handleAiProjectFilter = useCallback(async () => {
    if (!aiProjectQuery.trim()) return;

    try {
      setAiFiltering(true);
      const response = await fetch("/api/projects/ai-filter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: aiProjectQuery,
          page: currentPage,
          limit: 10,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to filter projects by AI");
      }

      const data = await response.json();
      setProjects(data.data || data);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to filter projects by AI",
      );
    } finally {
      setAiFiltering(false);
    }
  }, [aiProjectQuery, currentPage]);

  const handleProjectRecommendation = useCallback(async () => {
    try {
      setLoadingRecommendations(true);
      const response = await fetch("/api/projects/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context:
            "Recommend projects to prioritize based on current progress and deadlines",
          type: "priority",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get project recommendations");
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
          : "Failed to get project recommendations",
      );
    } finally {
      setLoadingRecommendations(false);
    }
  }, []);

  const handleDeleteClick = (project: Project) => {
    confirm({
      title: "Delete Project",
      message: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      variant: "danger",
      confirmText: "Delete",
      onConfirm: async () => {
        const response = await fetch(
          `/api/projects/${project.id}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          throw new Error("Failed to delete project");
        }

        invalidateCache();
      }
    });
  };

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Loading Projects...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <h3>Error Loading Projects</h3>
        <p>Failed to load projects. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <>
      <div className="project-filters">
        <SearchBar
          entityType="projects"
          onSearch={handleSearch}
          placeholder="Search projects by name..."
          ariaLabel="Search projects"
        />
        <div className="project-filter-dropdowns">
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
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
          <div className="progress-filter">
            <input
              type="number"
              className="progress-input"
              placeholder="Min %"
              min="0"
              max="100"
              value={progressMin}
              onChange={(e) => setProgressMin(e.target.value)}
              aria-label="Minimum progress"
            />
            <span className="progress-separator">-</span>
            <input
              type="number"
              className="progress-input"
              placeholder="Max %"
              min="0"
              max="100"
              value={progressMax}
              onChange={(e) => setProgressMax(e.target.value)}
              aria-label="Maximum progress"
            />
          </div>
        </div>
        <div className="ai-project-filter">
          <input
            type="text"
            className="ai-skill-input"
            placeholder="Describe project requirements (e.g., 'active high priority projects starting next month')"
            value={aiProjectQuery}
            onChange={(e) => setAiProjectQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAiProjectFilter()}
            aria-label="AI project filter query"
          />
          <Button
            onClick={handleAiProjectFilter}
            disabled={aiFiltering || !aiProjectQuery.trim()}
            variant="primary"
          >
            {aiFiltering ? "Filtering..." : "AI Filter"}
          </Button>
        </div>
        <Button
          onClick={handleProjectRecommendation}
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
            <h4>Recommended Projects</h4>
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
            {recommendations.map((projectId) => {
              const project = projects.find((p) => p.id === projectId);
              return project ? (
                <div key={projectId} className="recommendation-item">
                  <span className="recommendation-item-name">
                    {project.name}
                  </span>
                  <Badge
                    variant={
                      project.priority === "high"
                        ? "default"
                        : project.priority === "medium"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {project.priority}
                  </Badge>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
      {!projects || projects.length === 0 ? (
        <div className="empty-state">
          <h3>No Projects Found</h3>
          <p>Click &quot;Add Project&quot; to create your first project.</p>
        </div>
      ) : (
        <>
          <div className="grid-layout">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex-between-start">
                    <div className="flex-1">
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>
                        {project.description || "No description"}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        project.status === "active"
                          ? "default"
                          : project.status === "completed"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {project.status
                        .replace("_", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    {project.progress !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono text-muted-foreground">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} />
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      {project.startdate && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-off-white">Start:</span> {project.startdate}
                        </p>
                      )}
                      {project.enddate && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-off-white">End:</span> {project.enddate}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-between-end">
                  <Button
                    variant="secondary"
                    icon="edit"
                    onClick={() => projectFormRef.current?.open(project)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    icon="trash"
                    onClick={() => handleDeleteClick(project)}
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
      <ProjectForm ref={projectFormRef} onSuccess={invalidateCache} />
    </>
  );
}
