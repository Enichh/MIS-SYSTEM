'use client';

import { useState, useEffect } from 'react';
import type { Employee } from '@/types';
import { Button } from '@/app/components/ui/Button/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/app/components/ui/Card/Card';
import { Badge } from '@/app/components/ui/Badge/Badge';
import DeleteConfirmation from '@/components/confirmation/DeleteConfirmation/DeleteConfirmation';

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    employeeId: string | null;
    employeeName: string;
  }>({
    isOpen: false,
    employeeId: null,
    employeeName: '',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees');
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
  };

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
          <summary className="cursor-pointer text-destructive font-medium">Error Details</summary>
          <pre className="mt-2 p-2 bg-destructive/10 rounded overflow-auto text-xs">
            {error}
          </pre>
        </details>
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Employees Found</h3>
        <p>Click &quot;Add Employee&quot; to create your first employee.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4">
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
