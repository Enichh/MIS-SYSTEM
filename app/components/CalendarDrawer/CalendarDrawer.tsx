"use client";
// FIXED: Calendar no longer unmounts during loading, preserving month navigation state

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  isSameDay,
  getProjectsForDate,
  getTasksForDate,
  getProjectsForWeek,
  getTasksForWeek,
  getProjectsForMonth,
  getTasksForMonth,
  getWeekRange,
  getMonthRange,
} from "@/app/components/Calendar/Calendar";
import type { Project, Task } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/Select/Select";
import "./CalendarDrawer.css";

export function CalendarDrawer() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewFilter, setViewFilter] = useState<"day" | "week" | "month">("day");

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const fetchCalendarData = async (month: Date) => {
    try {
      setLoading(true);
      const year = month.getFullYear();
      const monthIndex = month.getMonth();

      // Calculate first and last day of the month for date range filtering
      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0);

      const formatDate = (date: Date) => date.toISOString().split("T")[0];

      // Fetch projects and tasks for the current month
      const [projectsResponse, tasksResponse] = await Promise.all([
        fetch(
          `/api/projects?dateRangeStart=${formatDate(firstDay)}&dateRangeEnd=${formatDate(lastDay)}`,
        ),
        fetch(
          `/api/tasks?dateRangeStart=${formatDate(firstDay)}&dateRangeEnd=${formatDate(lastDay)}`,
        ),
      ]);

      const projectsData = await projectsResponse.json();
      const tasksData = await tasksResponse.json();

      setProjects(projectsData.data || []);
      setTasks(tasksData.data || []);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(currentMonth);
  }, [currentMonth]);

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  return (
    <div className="calendar-drawer">
      <div className="calendar-drawer-header">
        <div className="calendar-drawer-header-content">
          <h3>Calendar</h3>
          <p className="calendar-drawer-subtitle">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="calendar-drawer-header-controls">
          <Select
            value={viewFilter}
            onValueChange={(value: "day" | "week" | "month") =>
              setViewFilter(value)
            }
          >
            <SelectTrigger
              className="calendar-filter-select"
              aria-label="Filter events by time period"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="calendar-legend">
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot calendar-legend-project" />
          <span className="calendar-legend-label">Projects</span>
        </div>
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot calendar-legend-task" />
          <span className="calendar-legend-label">Tasks</span>
        </div>
      </div>
      <div className="calendar-drawer-content">
        <div className="calendar-wrapper">
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
            projects={projects}
            tasks={tasks}
          />
          {loading && (
            <div className="calendar-loading-overlay">
              <div className="calendar-loading-spinner">Loading...</div>
            </div>
          )}
        </div>
        <EventsList
          selectedDate={selectedDate}
          projects={projects}
          tasks={tasks}
          viewFilter={viewFilter}
        />
      </div>
    </div>
  );
}

// Component to display events for the selected date
interface EventsListProps {
  selectedDate: Date;
  projects: Project[];
  tasks: Task[];
  viewFilter: "day" | "week" | "month";
}

function EventsList({
  selectedDate,
  projects,
  tasks,
  viewFilter,
}: EventsListProps) {
  const filteredProjects = useMemo(() => {
    switch (viewFilter) {
      case "day":
        return getProjectsForDate(selectedDate, projects);
      case "week":
        return getProjectsForWeek(selectedDate, projects);
      case "month":
        return getProjectsForMonth(selectedDate, projects);
    }
  }, [selectedDate, projects, viewFilter]);

  const filteredTasks = useMemo(() => {
    switch (viewFilter) {
      case "day":
        return getTasksForDate(selectedDate, tasks);
      case "week":
        return getTasksForWeek(selectedDate, tasks);
      case "month":
        return getTasksForMonth(selectedDate, tasks);
    }
  }, [selectedDate, tasks, viewFilter]);

  const hasEvents = filteredProjects.length > 0 || filteredTasks.length > 0;

  const getFilterLabel = () => {
    switch (viewFilter) {
      case "day":
        return selectedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      case "week":
        const weekRange = getWeekRange(selectedDate);
        return `${weekRange.start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${weekRange.end.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`;
      case "month":
        return selectedDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
    }
  };

  const getEmptyMessage = () => {
    switch (viewFilter) {
      case "day":
        return "No projects or tasks for this date";
      case "week":
        return "No projects or tasks for this week";
      case "month":
        return "No projects or tasks for this month";
    }
  };

  if (!hasEvents) {
    return (
      <div className="calendar-events">
        <p className="calendar-events-empty">{getEmptyMessage()}</p>
      </div>
    );
  }

  const formatDateRange = (start?: string, end?: string) => {
    if (!start) return "";
    const startStr = new Date(start).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (!end || start === end) return startStr;
    const endStr = new Date(end).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="calendar-events">
      <h4 className="calendar-events-title">{getFilterLabel()}</h4>

      {filteredProjects.length > 0 && (
        <div className="calendar-events-section">
          <h5 className="calendar-events-section-title calendar-events-projects">
            <span className="calendar-events-dot calendar-events-dot-project" />
            Active Projects ({filteredProjects.length})
          </h5>
          <ul className="calendar-events-list">
            {filteredProjects.map((project: Project) => (
              <li key={project.id} className="calendar-events-item">
                <span className="calendar-events-item-name">
                  {project.name}
                </span>
                <span className="calendar-events-item-meta">
                  {formatDateRange(project.startdate, project.enddate)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {filteredTasks.length > 0 && (
        <div className="calendar-events-section">
          <h5 className="calendar-events-section-title calendar-events-tasks">
            <span className="calendar-events-dot calendar-events-dot-task" />
            Tasks Due ({filteredTasks.length})
          </h5>
          <ul className="calendar-events-list">
            {filteredTasks.map((task: Task) => (
              <li key={task.id} className="calendar-events-item">
                <span className="calendar-events-item-name">{task.title}</span>
                <span
                  className={`calendar-events-item-status calendar-events-item-status-${task.status}`}
                >
                  {task.status.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
