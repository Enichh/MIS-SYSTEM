'use client';

import { useState, useEffect } from 'react';
import type { Employee } from '@/types';
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
      <div className="empty-state">
        <h3>Error Loading Employees</h3>
        <p>Failed to load employees. Please refresh the page.</p>
        <details style={{ marginTop: '1rem', textAlign: 'left', fontSize: '0.875rem' }}>
          <summary style={{ cursor: 'pointer', color: '#dc2626' }}>Error Details</summary>
          <pre style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '4px', overflow: 'auto' }}>
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
      <div className="data-list">
        {employees.map((employee) => (
          <div key={employee.id} className="data-card">
            <div className="data-card-header">
              <div>
                <div className="data-card-title">{employee.name}</div>
                <div className="data-card-subtitle">{employee.email}</div>
              </div>
              <span className="status-badge status-active">
                {employee.role}
              </span>
            </div>
            <div className="data-card-body">
              <p>
                <strong>Department:</strong> {employee.department}
              </p>
            </div>
            <div className="data-card-actions">
              <button
                data-action="edit"
                data-entity="employee"
                data-id={employee.id}
                className="btn-secondary"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteClick(employee)}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
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
