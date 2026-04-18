'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Employee, SearchQuery } from '@/types';
import { Button } from '@/app/components/ui/Button/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/app/components/ui/Card/Card';
import { Badge } from '@/app/components/ui/Badge/Badge';
import DeleteConfirmation from '@/app/components/confirmation/DeleteConfirmation/DeleteConfirmation';
import { SearchBar } from '@/app/components/SearchBar/SearchBar';

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    employeeId: string | null;
    employeeName: string;
  }>({
    isOpen: false,
    employeeId: null,
    employeeName: '',
  });

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const url = searchQuery ? `/api/employees?name=${encodeURIComponent(searchQuery)}` : '/api/employees';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      setEmployees(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearch = useCallback((query: SearchQuery) => {
    setSearchQuery(query.query);
  }, []);

  const handleDeleteClick = (employee: Employee) => {
    setDeleteConfirmation({
      isOpen: true,
      employeeId: employee.id,
      employeeName: employee.name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.employeeId) return;

    try {
      const response = await fetch(`/api/employees/${deleteConfirmation.employeeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      setDeleteConfirmation({ isOpen: false, employeeId: null, employeeName: '' });
      await loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, employeeId: null, employeeName: '' });
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
        <h3 className="text-lg font-semibold text-destructive">Error Loading Employees</h3>
        <p className="text-sm text-muted-foreground mt-1">Failed to load employees. Please refresh the page.</p>
        <details className="mt-4 text-left text-sm">
          <summary className="cursor-pointer text-destructive font-semibold">Error Details</summary>
          <pre className="mt-2 p-2 bg-destructive rounded overflow-auto text-xs">
            {error}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <>
      <SearchBar
        entityType="employees"
        onSearch={handleSearch}
        placeholder="Search employees by name..."
        ariaLabel="Search employees"
      />
      {!employees || employees.length === 0 ? (
        <div className="empty-state">
          <h3>No Employees Found</h3>
          <p>Click &quot;Add Employee&quot; to create your first employee.</p>
        </div>
      ) : (
        <div className="grid-layout">
          {employees.map((employee) => (
            <Card key={employee.id} className="employee-card">
              <CardHeader>
                <div className="employee-header">
                  <div className="employee-avatar">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="employee-info">
                    <CardTitle className="employee-name">{employee.name}</CardTitle>
                    <CardDescription className="employee-email">{employee.email}</CardDescription>
                  </div>
                  <Badge className="employee-role-badge">{employee.role}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="employee-department">{employee.department}</p>
                {employee.skills && employee.skills.length > 0 && (
                  <div className="employee-skills">
                    {employee.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="skill-badge">
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
                  data-action="edit"
                  data-entity="employee"
                  data-id={employee.id}
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
      )}
      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        entityName={deleteConfirmation.employeeName}
        entityType="Employee"
        variant="danger"
      />
    </>
  );
}
