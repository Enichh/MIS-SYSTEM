"use client";

import React, { useState } from "react";
import type { Project, Task } from "@/types";
import "./Calendar.css";

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange?: (month: Date) => void;
  projects?: Project[];
  tasks?: Task[];
}

// Helper functions exported for use in parent components
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

export function getProjectsForDate(date: Date, projects: Project[]): Project[] {
  if (!Array.isArray(projects)) return [];
  return projects.filter((project) => {
    if (!project.enddate) return false;
    const endDate = new Date(project.enddate);
    return isSameDay(date, endDate);
  });
}

export function getTasksForDate(date: Date, tasks: Task[]): Task[] {
  if (!Array.isArray(tasks)) return [];
  return tasks.filter((task) => {
    if (!task.duedate) return false;
    const dueDate = new Date(task.duedate);
    return isSameDay(date, dueDate);
  });
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getProjectsForWeek(date: Date, projects: Project[]): Project[] {
  if (!Array.isArray(projects)) return [];
  const { start, end } = getWeekRange(date);
  return projects.filter((project) => {
    if (!project.enddate) return false;
    const endDate = new Date(project.enddate);
    return endDate >= start && endDate <= end;
  });
}

export function getTasksForWeek(date: Date, tasks: Task[]): Task[] {
  if (!Array.isArray(tasks)) return [];
  const { start, end } = getWeekRange(date);
  return tasks.filter((task) => {
    if (!task.duedate) return false;
    const dueDate = new Date(task.duedate);
    return dueDate >= start && dueDate <= end;
  });
}

export function getProjectsForMonth(
  date: Date,
  projects: Project[],
): Project[] {
  if (!Array.isArray(projects)) return [];
  const { start, end } = getMonthRange(date);
  return projects.filter((project) => {
    if (!project.enddate) return false;
    const endDate = new Date(project.enddate);
    return endDate >= start && endDate <= end;
  });
}

export function getTasksForMonth(date: Date, tasks: Task[]): Task[] {
  if (!Array.isArray(tasks)) return [];
  const { start, end } = getMonthRange(date);
  return tasks.filter((task) => {
    if (!task.duedate) return false;
    const dueDate = new Date(task.duedate);
    return dueDate >= start && dueDate <= end;
  });
}

export function Calendar({
  selectedDate,
  onDateSelect,
  onMonthChange,
  projects = [],
  tasks = [],
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const previousMonth = () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
    );
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const nextMonth = () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
    );
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
    onMonthChange?.(today);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    onDateSelect(newDate);
  };

  const renderDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="calendar-day calendar-day-empty" />,
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day,
      );
      const isSelected = isSameDay(date, selectedDate);
      const isTodayDate = isToday(day);
      const dayProjects = getProjectsForDate(date, projects);
      const dayTasks = getTasksForDate(date, tasks);
      const hasEvents = dayProjects.length > 0 || dayTasks.length > 0;

      days.push(
        <button
          key={day}
          onClick={() => handleDayClick(day)}
          className={`calendar-day ${isSelected ? "calendar-day-selected" : ""} ${isTodayDate ? "calendar-day-today" : ""} ${hasEvents ? "calendar-day-has-events" : ""}`}
          aria-label={`Select ${monthNames[currentMonth.getMonth()]} ${day}, ${currentMonth.getFullYear()}${dayProjects.length > 0 ? `, ${dayProjects.length} project(s)` : ""}${dayTasks.length > 0 ? `, ${dayTasks.length} task(s)` : ""}`}
          aria-pressed={isSelected}
        >
          <span className="calendar-day-number">{day}</span>
          {hasEvents && (
            <div className="calendar-day-events">
              {dayProjects.map((project) => (
                <span
                  key={project.id}
                  className="calendar-event-pill calendar-event-project"
                  title={project.name}
                >
                  {project.name}
                </span>
              ))}
              {dayTasks.map((task) => (
                <span
                  key={task.id}
                  className="calendar-event-pill calendar-event-task"
                  title={task.title}
                >
                  {task.title}
                </span>
              ))}
            </div>
          )}
        </button>,
      );
    }

    return days;
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button
          onClick={previousMonth}
          className="calendar-nav-button"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h4 className="calendar-title">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h4>
        <button
          onClick={nextMonth}
          className="calendar-nav-button"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="calendar-weekdays">
        {dayNames.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-days">{renderDays()}</div>

      <div className="calendar-footer">
        <button onClick={goToToday} className="calendar-today-button">
          Today
        </button>
      </div>
    </div>
  );
}
