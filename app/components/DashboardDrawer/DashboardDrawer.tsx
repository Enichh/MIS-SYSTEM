"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UserIcon } from "@/app/components/ui/icons/custom/UserIcon";
import { SettingsIcon } from "@/app/components/ui/icons/custom/SettingsIcon";
import { MessageIcon } from "@/app/components/ui/icons/custom/MessageIcon";
import { AlertIcon } from "@/app/components/ui/icons/custom/AlertIcon";
import { ClockIcon } from "@/app/components/ui/icons/custom/ClockIcon";
import { FolderIcon } from "@/app/components/ui/icons/custom/FolderIcon";
import { useNavigationContext } from "@/lib/context/NavigationContext";

interface DashboardStats {
  totalEmployees: number;
  totalProjects: number;
  totalTasks: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  highPriorityTasks: number;
}

interface ActivityItem {
  id: string;
  type: "employee" | "project" | "task";
  title: string;
  description: string;
  timestamp: string;
}

interface PriorityItem {
  id: string;
  type: "task" | "project";
  title: string;
  priority: "high" | "medium" | "low";
  meta: string;
}

export function DashboardDrawer() {
  const { setActiveSection } = useNavigationContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [priorityItems, setPriorityItems] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/stats");

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();

      setStats({
        totalEmployees: data.employees.total,
        totalProjects: data.projects.total,
        totalTasks: data.tasks.total,
        activeProjects: data.projects.active,
        completedProjects: data.projects.completed,
        onHoldProjects: data.projects.onHold,
        completedTasks: data.tasks.completed,
        inProgressTasks: data.tasks.inProgress,
        pendingTasks: data.tasks.pending,
        highPriorityTasks: data.tasks.highPriority,
      });

      setRecentActivity(data.recentActivity || []);
      setPriorityItems(data.priorityItems || []);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "employee":
        return <UserIcon size={20} />;
      case "project":
        return <FolderIcon size={20} />;
      case "task":
        return <SettingsIcon size={20} />;
      default:
        return <MessageIcon size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-section">
        <div className="empty-state">
          <h3>Loading Dashboard...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-section">
        <div className="empty-state">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="dashboard-section">
      {/* Welcome Section */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-brand">
            <span className="dashboard-hero-logo">E</span>
            <h1 className="dashboard-hero-title">Enosoft</h1>
          </div>
          <p className="dashboard-hero-subtitle">
            Management Information System
          </p>
          <p className="dashboard-hero-description">
            Streamline your workforce, projects, and tasks in one place.
          </p>
        </div>
        <div className="dashboard-hero-pattern" aria-hidden="true">
          <div className="dashboard-hero-dot" />
          <div className="dashboard-hero-dot" />
          <div className="dashboard-hero-dot" />
          <div className="dashboard-hero-dot" />
          <div className="dashboard-hero-dot" />
          <div className="dashboard-hero-dot" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats-grid">
        {/* Employees Card */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Employees</span>
            <div className="stat-card-icon">
              <UserIcon size={24} />
            </div>
          </div>
          <div className="stat-card-value">{stats.totalEmployees}</div>
        </div>

        {/* Projects Card */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Projects</span>
            <div className="stat-card-icon">
              <FolderIcon size={24} />
            </div>
          </div>
          <div className="stat-card-value">{stats.totalProjects}</div>
          <div className="stat-breakdown">
            <span className="stat-breakdown-item">
              <span className="stat-breakdown-dot active" />
              {stats.activeProjects} Active
            </span>
            <span className="stat-breakdown-item">
              <span className="stat-breakdown-dot completed" />
              {stats.completedProjects} Completed
            </span>
            {stats.onHoldProjects > 0 && (
              <span className="stat-breakdown-item">
                <span className="stat-breakdown-dot on-hold" />
                {stats.onHoldProjects} On Hold
              </span>
            )}
          </div>
        </div>

        {/* Tasks Card */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Tasks</span>
            <div className="stat-card-icon">
              <SettingsIcon size={24} />
            </div>
          </div>
          <div className="stat-card-value">{stats.totalTasks}</div>
          <div className="stat-breakdown">
            <span className="stat-breakdown-item">
              <span className="stat-breakdown-dot completed" />
              {stats.completedTasks} Done
            </span>
            <span className="stat-breakdown-item">
              <span className="stat-breakdown-dot active" />
              {stats.inProgressTasks} In Progress
            </span>
            <span className="stat-breakdown-item">
              <span className="stat-breakdown-dot pending" />
              {stats.pendingTasks} Pending
            </span>
          </div>
        </div>

        {/* High Priority Card */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">High Priority</span>
            <div className="stat-card-icon">
              <AlertIcon size={24} />
            </div>
          </div>
          <div className="stat-card-value">{stats.highPriorityTasks}</div>
          <div className="stat-card-change negative">Requires attention</div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="dashboard-content-grid">
        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">
              <ClockIcon size={20} />
              Recent Activity
            </h3>
          </div>
          <div className="dashboard-card-content">
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground">No recent activity</p>
            ) : (
              <div className="activity-list">
                {recentActivity.map((item) => (
                  <div key={item.id} className="activity-item">
                    <div className="activity-icon">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">{item.title}</div>
                      <div className="activity-meta">
                        {item.description}
                        <span className="activity-time">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Priority Items */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">
              <AlertIcon size={20} />
              Priority Items
            </h3>
          </div>
          <div className="dashboard-card-content">
            {priorityItems.length === 0 ? (
              <p className="text-muted-foreground">No high priority items</p>
            ) : (
              <div className="priority-list">
                {priorityItems.map((item) => (
                  <div
                    key={item.id}
                    className={`priority-item ${item.priority}`}
                  >
                    <div className={`priority-indicator ${item.priority}`} />
                    <div className="priority-content">
                      <div className="priority-title">{item.title}</div>
                      <div className="priority-meta">{item.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h3 className="dashboard-card-title">
            <UserIcon size={20} />
            Quick Actions
          </h3>
        </div>
        <div className="dashboard-card-content">
          <div className="quick-actions-grid">
            <button
              className="quick-action-btn"
              onClick={() => setActiveSection("employees")}
              aria-label="Go to Employees"
            >
              <UserIcon size={24} />
              <span className="quick-action-label">Employees</span>
            </button>
            <button
              className="quick-action-btn"
              onClick={() => setActiveSection("projects")}
              aria-label="Go to Projects"
            >
              <FolderIcon size={24} />
              <span className="quick-action-label">Projects</span>
            </button>
            <button
              className="quick-action-btn"
              onClick={() => setActiveSection("tasks")}
              aria-label="Go to Tasks"
            >
              <SettingsIcon size={24} />
              <span className="quick-action-label">Tasks</span>
            </button>
            <button
              className="quick-action-btn"
              onClick={() => setActiveSection("ai")}
              aria-label="Go to AI Chat"
            >
              <MessageIcon size={24} />
              <span className="quick-action-label">AI Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
