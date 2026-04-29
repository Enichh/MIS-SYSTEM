"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Employee, SearchQuery } from "@/types";
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
import EmployeeForm, {
  type EmployeeFormRef,
} from "@/app/components/forms/EmployeeForm/EmployeeForm";
import { useConfirmation } from "@/lib/context/ConfirmationContext";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

interface EmployeeListProps {
  isActive?: boolean;
}

export default function EmployeeList({ isActive = true }: EmployeeListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [aiSkillQuery, setAiSkillQuery] = useState<string>("");
  const [aiFiltering, setAiFiltering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { confirm } = useConfirmation();
  const employeeFormRef = useRef<EmployeeFormRef>(null);

  const uniqueDepartments = useMemo(() => {
    const departments = new Set(allEmployees.map((e) => e.department));
    return Array.from(departments).sort();
  }, [allEmployees]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set(allEmployees.map((e) => e.role));
    return Array.from(roles).sort();
  }, [allEmployees]);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("name", searchQuery);
    if (departmentFilter !== "all")
      params.append("department", departmentFilter);
    if (roleFilter !== "all") params.append("role", roleFilter);
    params.append("page", currentPage.toString());
    params.append("limit", "10");

    return params.toString()
      ? `/api/employees?${params.toString()}`
      : "/api/employees?page=1&limit=10";
  }, [searchQuery, departmentFilter, roleFilter, currentPage]);

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
      setEmployees(swrData.data || swrData);
      setAllEmployees(swrData.data || swrData);
      setTotalPages(swrData.pagination?.totalPages || 1);
      setTotal(swrData.pagination?.total || 0);
      setError(null);
    }
  }, [swrData, aiFiltering]);

  useEffect(() => {
    if (swrError) {
      setError(swrError instanceof Error ? swrError.message : "Failed to load employees");
    }
  }, [swrError]);

  const invalidateCache = useCallback(() => {
    globalMutate((key) => typeof key === "string" && key.startsWith("/api/employees"));
  }, [globalMutate]);

  const handleSearch = useCallback((query: SearchQuery) => {
    setSearchQuery(query.query);
    setCurrentPage(1);
  }, []);

  const handleAiSkillFilter = useCallback(async () => {
    if (!aiSkillQuery.trim()) return;

    try {
      setAiFiltering(true);
      const response = await fetch("/api/employees/ai-filter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: aiSkillQuery,
          page: currentPage,
          limit: 10,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to filter employees by skills");
      }

      const data = await response.json();
      setEmployees(data.data || data);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to filter employees by skills",
      );
    } finally {
      setAiFiltering(false);
    }
  }, [aiSkillQuery, currentPage]);

  const handleDeleteClick = (employee: Employee) => {
    confirm({
      title: "Delete Employee",
      message: `Are you sure you want to delete "${employee.name}"? This action cannot be undone.`,
      variant: "danger",
      confirmText: "Delete",
      onConfirm: async () => {
        const response = await fetch(
          `/api/employees/${employee.id}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          throw new Error("Failed to delete employee");
        }

        invalidateCache();
      }
    });
  };

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Loading Employees...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-semibold text-destructive">
          Error Loading Employees
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Failed to load employees. Please refresh the page.
        </p>
        <details className="mt-4 text-left text-sm">
          <summary className="cursor-pointer text-destructive font-semibold">
            Error Details
          </summary>
          <pre className="mt-2 p-2 bg-destructive rounded overflow-auto text-xs">
            {error}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <>
      <div className="employee-filters">
        <SearchBar
          entityType="employees"
          onSearch={handleSearch}
          placeholder="Search employees by name..."
          ariaLabel="Search employees"
        />
        <div className="employee-filter-dropdowns">
          <Select
            value={departmentFilter}
            onValueChange={(value) => {
              setDepartmentFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              className="filter-select"
              aria-label="Filter by department"
            >
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {uniqueDepartments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              className="filter-select"
              aria-label="Filter by role"
            >
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ai-skill-filter">
          <input
            type="text"
            className="ai-skill-input"
            placeholder="Describe skills or roles (e.g., 'React developers with leadership skills')"
            value={aiSkillQuery}
            onChange={(e) => setAiSkillQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAiSkillFilter()}
            aria-label="AI skill filter query"
          />
          <Button
            onClick={handleAiSkillFilter}
            disabled={aiFiltering || !aiSkillQuery.trim()}
            variant="primary"
          >
            {aiFiltering ? "Filtering..." : "AI Filter"}
          </Button>
        </div>
      </div>
      {!employees || employees.length === 0 ? (
        <div className="empty-state">
          <h3>No Employees Found</h3>
          <p>Click &quot;Add Employee&quot; to create your first employee.</p>
        </div>
      ) : (
        <>
          <div className="grid-layout">
            {employees.map((employee) => (
              <Card key={employee.id}>
                <CardHeader>
                  <div className="flex-between-start">
                    <div className="flex-1">
                      <CardTitle>{employee.name}</CardTitle>
                      <CardDescription>{employee.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="employee-department">{employee.department}</p>
                  {employee.skills && employee.skills.length > 0 && (
                    <div className="employee-skills">
                      {employee.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="employee-card-actions">
                  <Button
                    variant="secondary"
                    icon="edit"
                    onClick={() => employeeFormRef.current?.open(employee)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    icon="trash"
                    onClick={() => handleDeleteClick(employee)}
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
      <EmployeeForm ref={employeeFormRef} onSuccess={invalidateCache} />
    </>
  );
}
