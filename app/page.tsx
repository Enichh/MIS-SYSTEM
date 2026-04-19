"use client";

import { useRef } from "react";
import Header from "./components/Header/Header";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { Drawer } from "./components/Drawer/Drawer";
import { DashboardDrawer } from "./components/DashboardDrawer/DashboardDrawer";
import { CalendarDrawer } from "./components/CalendarDrawer/CalendarDrawer";
import { ReportDrawer } from "./components/ReportDrawer/ReportDrawer";
import EmployeeList from "./components/EmployeeList/EmployeeList";
import ProjectList from "./components/ProjectList/ProjectList";
import TaskList from "./components/TaskList/TaskList";
import { DrawerChat } from "./components/DrawerChat/DrawerChat";
import EmployeeForm, {
  type EmployeeFormRef,
} from "./components/forms/EmployeeForm/EmployeeForm";
import ProjectForm, {
  type ProjectFormRef,
} from "./components/forms/ProjectForm/ProjectForm";
import TaskForm, {
  type TaskFormRef,
} from "./components/forms/TaskForm/TaskForm";
import {
  useNavigationContext,
  type Section,
} from "@/lib/context/NavigationContext";
import { Button } from "./components/ui/Button/Button";

// Import dashboard styles
import "./styles/dashboard.css";

export default function HomePage() {
  const { activeSection } = useNavigationContext();
  const employeeFormRef = useRef<EmployeeFormRef>(null);
  const projectFormRef = useRef<ProjectFormRef>(null);
  const taskFormRef = useRef<TaskFormRef>(null);

  const isSectionActive = (section: Section) => activeSection === section;

  return (
    <>
      <Header />
      <Drawer />

      <div className="app-layout">
        <Sidebar />
        <main className="main">
          {/* Dashboard Section - Default */}
          <section
            id="dashboard-section"
            className={`section ${isSectionActive("dashboard") ? "section-active" : ""}`}
          >
            <DashboardDrawer />
          </section>

          <section
            id="employees-section"
            className={`section ${isSectionActive("employees") ? "section-active" : ""}`}
          >
            <div className="section-header">
              <h2>Employees</h2>
              <Button onClick={() => employeeFormRef.current?.open()}>
                Add Employee
              </Button>
            </div>
            <EmployeeList isActive={isSectionActive("employees")} />
          </section>

          <section
            id="projects-section"
            className={`section ${isSectionActive("projects") ? "section-active" : ""}`}
          >
            <div className="section-header">
              <h2>Projects</h2>
              <Button onClick={() => projectFormRef.current?.open()}>
                Add Project
              </Button>
            </div>
            <ProjectList isActive={isSectionActive("projects")} />
          </section>

          <section
            id="tasks-section"
            className={`section ${isSectionActive("tasks") ? "section-active" : ""}`}
          >
            <div className="section-header">
              <h2>Tasks</h2>
              <Button onClick={() => taskFormRef.current?.open()}>
                Add Task
              </Button>
            </div>
            <TaskList isActive={isSectionActive("tasks")} />
          </section>

          <section
            id="ai-section"
            className={`section ${isSectionActive("ai") ? "section-active" : ""}`}
          >
            <DrawerChat />
          </section>

          <section
            id="calendar-section"
            className={`section ${isSectionActive("calendar") ? "section-active" : ""}`}
          >
            <CalendarDrawer />
          </section>

          <section
            id="reports-section"
            className={`section ${isSectionActive("reports") ? "section-active" : ""}`}
          >
            <ReportDrawer />
          </section>
        </main>
      </div>
      <EmployeeForm ref={employeeFormRef} />
      <ProjectForm ref={projectFormRef} />
      <TaskForm ref={taskFormRef} />
    </>
  );
}
