import { NextRequest, NextResponse } from "next/server";
import { streamText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { STREAMING_CONFIG } from "@/lib/utils/ai-config";
import { handleApiError } from "@/lib/utils/api-handler";
import {
  detectQueryIntent,
  buildKnowledgeContext,
} from "@/lib/utils/knowledge";
import { fetchFromDatabase, updateToDatabase } from "@/lib/utils/database";
import { createEmployee } from "@/lib/services/employeeService";
import { createProject } from "@/lib/services/projectService";
import { createTask } from "@/lib/services/taskService";
import { assignEmployeeToProject } from "@/lib/services/employeeProjectService";
import { generateReportData } from "@/lib/services/reportService";
import { MilestoneService } from "@/lib/services/milestoneService";
import { RaidService } from "@/lib/services/raidService";
import {
  searchEmployeesWithData,
  searchProjectsWithData,
  searchTasksWithData,
} from "@/lib/utils/embeddings";
import type {
  ApiResponse,
  KnowledgeQuery,
  Milestone,
  RaidItem,
  RaidType,
} from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Internal helper: Build enhanced context with database fetching
async function buildEnhancedContext(query?: string): Promise<string> {
  const contextParts: string[] = [];

  if (query) {
    const intent = detectQueryIntent(query);

    if (intent === "employee") {
      const startTime = Date.now();
      const employees = await searchEmployeesWithData(query, 10);

      if (employees.length > 0) {
        contextParts.push(`Relevant Employees (${employees.length}):`);

        // Fetch relational data for each employee in parallel
        const employeeDataPromises = employees.map(async (emp) => {
          const [tasks, projects] = await Promise.all([
            fetchFromDatabase("tasks", { assignedto: emp.id }),
            fetchFromDatabase("employee_projects", { employee_id: emp.id }),
          ]);

          return { emp, tasks, projects };
        });

        const employeeData = await Promise.all(employeeDataPromises);

        employeeData.forEach(({ emp, tasks, projects }) => {
          const skills = Array.isArray(emp.skills)
            ? emp.skills.join(", ")
            : "None";
          contextParts.push(
            `  - ${emp.name || "Unknown"} (Role: ${emp.role || "Unknown"}, Dept: ${emp.department || "Unknown"})`,
          );
          contextParts.push(`    Skills: ${skills}`);

          if (tasks.length > 0) {
            const completedCount = (tasks as any[]).filter(
              (t) => t.status === "completed",
            ).length;
            const inProgressCount = (tasks as any[]).filter(
              (t) => t.status === "in_progress",
            ).length;
            const pendingCount = (tasks as any[]).filter(
              (t) => t.status === "pending",
            ).length;
            contextParts.push(
              `    Workload: ${tasks.length} tasks (${completedCount} completed, ${inProgressCount} in-progress, ${pendingCount} pending)`,
            );

            const activeTasks = (tasks as any[])
              .filter(
                (t) => t.status === "in_progress" || t.status === "pending",
              )
              .slice(0, 3);
            if (activeTasks.length > 0) {
              contextParts.push(
                `    Current Tasks: ${activeTasks.map((t) => t.title).join(", ")}`,
              );
            }
          } else {
            contextParts.push(`    Workload: No tasks assigned`);
          }

          if (projects.length > 0) {
            contextParts.push(
              `    Projects: ${projects.length} project assignment(s)`,
            );
          }
        });

        console.log(
          `[Context Build] Employee intent processed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        );
      }
    }

    if (intent === "task") {
      const startTime = Date.now();
      const tasks = await searchTasksWithData(query, 15);

      if (tasks.length > 0) {
        // Fetch related employee and project data for lookups
        const [employees, projects] = await Promise.all([
          fetchFromDatabase("employees", {}),
          fetchFromDatabase("projects", {}),
        ]);

        const employeeMap = new Map(
          (employees as any[]).map((e) => [e.id, e.name]),
        );
        const projectMap = new Map(
          (projects as any[]).map((p) => [p.id, p.name]),
        );

        contextParts.push(`Relevant Tasks (${tasks.length}):`);

        tasks.forEach((task) => {
          const assigneeName = task.assignedto
            ? employeeMap.get(task.assignedto) || "Unknown"
            : "Unassigned";
          const projectName = task.projectid
            ? projectMap.get(task.projectid) || "Unknown Project"
            : "No Project";

          contextParts.push(
            `  - ${task.title || "Unknown"} (Status: ${task.status || "Unknown"}, Priority: ${task.priority || "Unknown"})`,
          );
          contextParts.push(`    Assigned To: ${assigneeName}`);
          contextParts.push(`    Project: ${projectName}`);

          if (
            task.dependencies &&
            Array.isArray(task.dependencies) &&
            task.dependencies.length > 0
          ) {
            contextParts.push(
              `    Dependencies: ${task.dependencies.length} task(s)`,
            );
          }
        });

        console.log(
          `[Context Build] Task intent processed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        );
      }
    }

    if (intent === "project") {
      const startTime = Date.now();
      const projects = await searchProjectsWithData(query, 10);

      if (projects.length > 0) {
        // Fetch related data for all lookups
        const [employees, allTasks, employeeProjects] = await Promise.all([
          fetchFromDatabase("employees", {}),
          fetchFromDatabase("tasks", {}),
          fetchFromDatabase("employee_projects", {}),
        ]);

        const employeeMap = new Map(
          (employees as any[]).map((e) => [e.id, e.name]),
        );
        const tasksByProject = new Map<string, any[]>();
        const employeesByProject = new Map<string, string[]>();

        (allTasks as any[]).forEach((task) => {
          if (task.projectid) {
            if (!tasksByProject.has(task.projectid)) {
              tasksByProject.set(task.projectid, []);
            }
            tasksByProject.get(task.projectid)?.push(task);
          }
        });

        (employeeProjects as any[]).forEach((ep) => {
          if (ep.project_id) {
            if (!employeesByProject.has(ep.project_id)) {
              employeesByProject.set(ep.project_id, []);
            }
            const empName = employeeMap.get(ep.employee_id) || "Unknown";
            employeesByProject.get(ep.project_id)?.push(empName);
          }
        });

        contextParts.push(`Relevant Projects (${projects.length}):`);

        projects.forEach((proj) => {
          const tasks = tasksByProject.get(proj.id) || [];
          const team = employeesByProject.get(proj.id) || [];

          contextParts.push(
            `  - ${proj.name || "Unknown"} (Status: ${proj.status || "Unknown"}, Progress: ${proj.progress ?? 0}%)`,
          );

          if (tasks.length > 0) {
            const completed = tasks.filter(
              (t) => t.status === "completed",
            ).length;
            const inProgress = tasks.filter(
              (t) => t.status === "in_progress",
            ).length;
            const pending = tasks.filter((t) => t.status === "pending").length;
            contextParts.push(
              `    Tasks: ${tasks.length} total (${completed} completed, ${inProgress} in-progress, ${pending} pending)`,
            );
          } else {
            contextParts.push(`    Tasks: No tasks`);
          }

          if (team.length > 0) {
            contextParts.push(
              `    Team: ${team.slice(0, 5).join(", ")}${team.length > 5 ? ` +${team.length - 5} more` : ""}`,
            );
          } else {
            contextParts.push(`    Team: No members assigned`);
          }
        });

        console.log(
          `[Context Build] Project intent processed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        );
      }
    }
  }

  return contextParts.join("\n");
}

// TODO: Add authentication check before production deployment

// Define tools for entity creation and assignment
const tools = {
  createEmployee: tool({
    description:
      "Create a new employee in the system. Returns the employee ID for use in subsequent tool calls.",
    parameters: z.object({
      name: z.string().describe("Employee name (required)"),
      email: z.string().email().describe("Employee email (required)"),
      role: z.string().describe("Employee role (required)"),
      department: z.string().describe("Employee department (required)"),
      skills: z
        .array(z.string())
        .optional()
        .describe("Employee skills (optional)"),
    }),
    execute: async ({ name, email, role, department, skills }) => {
      try {
        const result = await createEmployee({
          name,
          email,
          role,
          department,
          skills: skills || [],
        });
        return {
          message: `Employee "${result.name}" created successfully in the ${result.department} department.`,
          id: result.id,
          name: result.name,
          email: result.email,
          role: result.role,
          department: result.department,
        };
      } catch (error) {
        return `Failed to create employee: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  }),

  createProject: tool({
    description:
      "Create a new project in the system. Returns the project ID for use in subsequent tool calls.",
    parameters: z.object({
      name: z.string().describe("Project name (required)"),
      description: z
        .string()
        .optional()
        .describe("Project description (optional)"),
    }),
    execute: async ({ name, description }) => {
      try {
        const result = await createProject({
          name,
          description: description || "",
          status: "active",
          priority: "medium",
          progress: 0,
        });

        // Automatically seed standard milestones for new project
        await MilestoneService.seedStandardMilestones(result.id);

        return {
          message: `Project "${result.name}" created successfully and initialized with standard milestones (Kick Off, Development, etc.).`,
          id: result.id,
          name: result.name,
          description: result.description,
        };
      } catch (error) {
        return `Failed to create project: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  }),

  createTask: tool({
    description:
      "Create a new task in the system. Returns the task ID for use in subsequent tool calls.",
    parameters: z.object({
      title: z.string().describe("Task title (required)"),
      description: z
        .string()
        .optional()
        .describe("Task description (optional)"),
      projectId: z.string().describe("Project ID (required)"),
      milestoneId: z
        .string()
        .optional()
        .describe(
          "Milestone ID (optional - use getProjectTimeline to find available milestones)",
        ),
    }),
    execute: async ({ title, description, projectId, milestoneId }) => {
      try {
        const result = await createTask({
          title,
          description: description || "",
          projectid: projectId,
          milestone_id: milestoneId || null,
          status: "pending",
          priority: "medium",
          dependencies: [],
          assignedto: null,
        });
        return {
          message: `Task "${result.title}" created successfully.`,
          id: result.id,
          title: result.title,
          projectid: result.projectid,
        };
      } catch (error) {
        return `Failed to create task: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  }),

  assignEmployee: tool({
    description: "Assign an employee to a task",
    parameters: z.object({
      employeeId: z
        .string()
        .describe("Employee ID (required - use getEmployeeId tool to find it)"),
      taskId: z
        .string()
        .describe("Task ID (required - use getTaskId tool to find it)"),
    }),
    execute: async ({ employeeId, taskId }) => {
      try {
        console.log(
          `[TASK_ASSIGN] Assigning employee ${employeeId} to task ${taskId}`,
        );
        // Verify employee exists
        const employees = await fetchFromDatabase("employees", {
          id: employeeId,
        });
        if (!employees || employees.length === 0) {
          console.log(`[TASK_ASSIGN] Failed: Employee ${employeeId} not found`);
          return "Employee not found. Please use getEmployeeId tool to find the correct ID.";
        }

        const employeeName = (employees[0] as any).name;
        console.log(
          `[TASK_ASSIGN] Employee found: ${employeeName} (ID: ${employeeId})`,
        );

        // Verify task exists
        const tasks = await fetchFromDatabase("tasks", { id: taskId });
        if (!tasks || tasks.length === 0) {
          console.log(`[TASK_ASSIGN] Failed: Task ${taskId} not found`);
          return "Task not found. Please use getTaskId tool to find the correct ID.";
        }

        const taskTitle = (tasks[0] as any).title;
        console.log(`[TASK_ASSIGN] Task found: ${taskTitle} (ID: ${taskId})`);

        await updateToDatabase("tasks", taskId, { assignedto: employeeId });
        console.log(
          `[TASK_ASSIGN] Successfully assigned employee ${employeeName} to task ${taskTitle}`,
        );
        return {
          message: `Successfully assigned **${employeeName}** to task **${taskTitle}**`,
          employeeId,
          taskId,
          employeeName,
          taskTitle,
        };
      } catch (error) {
        console.log(
          `[TASK_ASSIGN] Failed to assign employee ${employeeId} to task ${taskId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        return `Failed to assign employee: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  }),

  assignProject: tool({
    description: "Assign an employee to a project",
    parameters: z.object({
      employeeId: z
        .string()
        .describe("Employee ID (required - use getEmployeeId tool to find it)"),
      projectId: z
        .string()
        .describe("Project ID (required - use getProjectId tool to find it)"),
    }),
    execute: async ({ employeeId, projectId }) => {
      try {
        console.log(
          `[PROJECT_ASSIGN_AI] Assigning employee ${employeeId} to project ${projectId}`,
        );
        const assignment = await assignEmployeeToProject(employeeId, projectId);

        // Fetch names for a friendlier response
        const [employees, projects] = await Promise.all([
          fetchFromDatabase("employees", { id: employeeId }),
          fetchFromDatabase("projects", { id: projectId }),
        ]);
        const employeeName = (employees[0] as any)?.name || "Unknown";
        const projectName = (projects[0] as any)?.name || "Unknown";

        return {
          message: `Successfully assigned **${employeeName}** to project **${projectName}**`,
          employeeId,
          projectId,
          employeeName,
          projectName,
        };
      } catch (error) {
        console.log(
          `[PROJECT_ASSIGN_AI] Failed to assign employee ${employeeId} to project ${projectId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        return `Failed to assign employee to project: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  }),

  getEmployeeId: tool({
    description: "Find an employee ID by name or partial/exact ID match",
    parameters: z.object({
      query: z.string().describe("Employee name or ID to search for"),
    }),
    execute: async ({ query }) => {
      const employees = await fetchFromDatabase("employees", {});
      const normalized = query.toLowerCase().trim();
      const matches = (employees as any[]).filter(
        (e) =>
          e.name.toLowerCase().includes(normalized) ||
          e.id.toLowerCase() === normalized ||
          e.id.toLowerCase().includes(normalized),
      );
      if (matches.length === 0) {
        return `No employee found matching "${query}".`;
      }
      if (matches.length > 1) {
        const list = matches
          .map((e) => `${e.name} (ID: ${e.id}, Role: ${e.role})`)
          .join(", ");
        return `Multiple employees found: ${list}. Please be more specific.`;
      }
      return matches[0].id;
    },
  }),

  getProjectId: tool({
    description: "Find a project ID by name or partial/exact ID match",
    parameters: z.object({
      query: z.string().describe("Project name or ID to search for"),
    }),
    execute: async ({ query }) => {
      const projects = await fetchFromDatabase("projects", {});
      const normalized = query.toLowerCase().trim();
      const matches = (projects as any[]).filter(
        (p) =>
          p.name.toLowerCase().includes(normalized) ||
          p.id.toLowerCase() === normalized ||
          p.id.toLowerCase().includes(normalized),
      );
      if (matches.length === 0) {
        return `No project found matching "${query}".`;
      }
      if (matches.length > 1) {
        const list = matches.map((p) => `${p.name} (ID: ${p.id})`).join(", ");
        return `Multiple projects found: ${list}. Please be more specific.`;
      }
      return matches[0].id;
    },
  }),

  getTaskId: tool({
    description: "Find a task ID by title or partial/exact ID match",
    parameters: z.object({
      query: z.string().describe("Task title or ID to search for"),
    }),
    execute: async ({ query }) => {
      const tasks = await fetchFromDatabase("tasks", {});
      const normalized = query.toLowerCase().trim();
      const matches = (tasks as any[]).filter(
        (t) =>
          t.title.toLowerCase().includes(normalized) ||
          t.id.toLowerCase() === normalized ||
          t.id.toLowerCase().includes(normalized),
      );
      if (matches.length === 0) {
        return `No task found matching "${query}".`;
      }
      if (matches.length > 1) {
        const list = matches.map((t) => `${t.title} (ID: ${t.id})`).join(", ");
        return `Multiple tasks found: ${list}. Please be more specific.`;
      }
      return matches[0].id;
    },
  }),

  updateTask: tool({
    description:
      "Update an existing task's status, priority, assignedTo, title, or description. Use this to mark tasks as completed, change priority, reassign, or edit details.",
    parameters: z.object({
      taskId: z
        .string()
        .describe("Task ID to update (use getTaskId if you don't have it)"),
      status: z
        .enum(["pending", "in_progress", "completed"])
        .optional()
        .describe("New status for the task"),
      priority: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe("New priority level"),
      assignedto: z
        .string()
        .optional()
        .describe("Employee ID to assign (use null to unassign)"),
      title: z.string().optional().describe("New task title"),
      description: z.string().optional().describe("New task description"),
    }),
    execute: async ({ taskId, ...updates }) => {
      try {
        // Filter out undefined values
        // Map camelCase parameter to lowercase column name
        const mappedUpdates: Record<string, unknown> = {};
        if (updates.status !== undefined) mappedUpdates.status = updates.status;
        if (updates.priority !== undefined)
          mappedUpdates.priority = updates.priority;
        if (updates.assignedto !== undefined)
          mappedUpdates.assignedto = updates.assignedto;
        if (updates.title !== undefined) mappedUpdates.title = updates.title;
        if (updates.description !== undefined)
          mappedUpdates.description = updates.description;

        if (Object.keys(mappedUpdates).length === 0) {
          return "No valid fields provided for update. Please specify at least one field to update (status, priority, assignedTo, title, or description).";
        }

        // Verify task exists first
        const tasks = await fetchFromDatabase("tasks", { id: taskId });
        if (!tasks || tasks.length === 0) {
          return `Task with ID "${taskId}" not found.`;
        }

        const previousTitle = (tasks[0] as any).title;
        const result = await updateToDatabase<{ title: string }>(
          "tasks",
          taskId,
          mappedUpdates,
        );

        const changes = Object.entries(mappedUpdates)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");

        return `Task "${result?.title || previousTitle}" updated successfully. Changes: ${changes}.`;
      } catch (error) {
        return `Failed to update task: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  }),

  updateProject: tool({
    description:
      "Update an existing project's status, progress, name, or description. Use this to mark projects as completed, update progress percentage, or edit details.",
    parameters: z.object({
      projectId: z
        .string()
        .describe(
          "Project ID to update (use getProjectId if you don't have it)",
        ),
      status: z
        .enum(["active", "completed", "on_hold"])
        .optional()
        .describe("New project status"),
      progress: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe("Progress percentage (0-100)"),
      name: z.string().optional().describe("New project name"),
      description: z.string().optional().describe("New project description"),
    }),
    execute: async ({ projectId, ...updates }) => {
      try {
        // Filter out undefined values
        const validUpdates = Object.fromEntries(
          Object.entries(updates).filter(([_, v]) => v !== undefined),
        );

        if (Object.keys(validUpdates).length === 0) {
          return "No valid fields provided for update. Please specify at least one field to update (status, progress, name, or description).";
        }

        // Verify project exists first
        const projects = await fetchFromDatabase("projects", { id: projectId });
        if (!projects || projects.length === 0) {
          return `Project with ID "${projectId}" not found.`;
        }

        const previousName = (projects[0] as any).name;
        const result = await updateToDatabase<{ name: string }>(
          "projects",
          projectId,
          validUpdates,
        );

        const changes = Object.entries(validUpdates)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");

        return `Project "${result?.name || previousName}" updated successfully. Changes: ${changes}.`;
      } catch (error) {
        return `Failed to update project: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  }),

  searchEmployeesByAttribute: tool({
    description:
      "Search and filter employees by skills, department, role, or any combination. Use this instead of listing all employees when looking for specific qualifications.",
    parameters: z.object({
      skills: z
        .array(z.string())
        .optional()
        .describe('Skill keywords to search for (e.g., ["React", "Supabase"])'),
      department: z
        .string()
        .optional()
        .describe(
          'Department name to filter by (e.g., "Computer Science", "Engineering")',
        ),
      role: z
        .string()
        .optional()
        .describe('Role title to filter by (e.g., "Developer", "Manager")'),
      matchAllSkills: z
        .boolean()
        .default(false)
        .describe(
          "If true, employee must have ALL listed skills. If false, ANY skill matches.",
        ),
    }),
    execute: async ({ skills, department, role, matchAllSkills }) => {
      try {
        const employees = await fetchFromDatabase("employees", {});

        if (employees.length === 0) {
          return "No employees in the database.";
        }

        const matches = (employees as any[]).filter((e) => {
          // Skills matching
          let matchesSkills = true;
          if (skills && skills.length > 0) {
            const employeeSkills = (e.skills || []).map((s: string) =>
              s.toLowerCase(),
            );
            const querySkills = skills.map((s) => s.toLowerCase().trim());

            matchesSkills = matchAllSkills
              ? querySkills.every((s) =>
                  employeeSkills.some((es: string) => es.includes(s)),
                )
              : querySkills.some((s) =>
                  employeeSkills.some((es: string) => es.includes(s)),
                );
          }

          // Department matching (case-insensitive partial)
          const matchesDept =
            !department ||
            (e.department &&
              e.department
                .toLowerCase()
                .includes(department.toLowerCase().trim()));

          // Role matching (case-insensitive partial)
          const matchesRole =
            !role ||
            (e.role &&
              e.role.toLowerCase().includes(role.toLowerCase().trim()));

          return matchesSkills && matchesDept && matchesRole;
        });

        if (matches.length === 0) {
          const criteria = [
            skills?.length ? `skills: ${skills.join(", ")}` : null,
            department ? `department: ${department}` : null,
            role ? `role: ${role}` : null,
          ]
            .filter(Boolean)
            .join(", ");
          return `No employees found matching criteria (${criteria}).`;
        }

        // Format results with key info
        const results = matches
          .map((e) => {
            const skillsStr = (e.skills || []).join(", ") || "None";
            return `${e.name} (ID: ${e.id}, Dept: ${e.department}, Role: ${e.role}, Skills: ${skillsStr})`;
          })
          .join("\n");

        return `Found ${matches.length} employee(s):\n${results}`;
      } catch (error) {
        return `Failed to search employees: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  }),

  generateReport: tool({
    description:
      "Generate a report (employee_summary, project_status, task_overview, workload_analysis, or custom). Use when the user asks for a report, summary, or export of data.",
    parameters: z.object({
      reportType: z
        .enum([
          "employee_summary",
          "project_status",
          "task_overview",
          "workload_analysis",
          "custom",
        ])
        .describe("Type of report to generate"),
      filters: z
        .record(z.unknown())
        .optional()
        .describe("Optional filters to apply to the report data"),
      naturalLanguageQuery: z
        .string()
        .optional()
        .describe("The original user query for context"),
    }),
    execute: async ({ reportType, filters, naturalLanguageQuery }) => {
      try {
        const config = {
          type: reportType,
          filters: filters || {},
          includeCharts: true,
          includeMetrics: true,
        };

        const reportData = await generateReportData(config);

        // Format a summary for the AI to present to the user
        const sections = reportData.sections
          .map((s) => `${s.title}: ${s.content}`)
          .join("\n\n");
        const metrics = reportData.metrics
          .map((m) => `${m.label}: ${m.value}${m.unit ? " " + m.unit : ""}`)
          .join(", ");

        return {
          message: `Generated "${reportData.title}" report successfully.`,
          summary: sections,
          metrics: metrics,
          generatedAt: reportData.generatedAt,
          type: reportData.type,
          chartCount: reportData.charts.length,
        };
      } catch (error) {
        return `Failed to generate report: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  }),

  createMilestone: tool({
    description:
      "Create a custom milestone for a project. Use this if the standard milestones (Kick Off, etc.) are not enough.",
    parameters: z.object({
      projectId: z.string().describe("The ID of the project"),
      name: z.string().describe("The name of the custom milestone"),
      description: z.string().optional().describe("Optional description"),
      orderIndex: z
        .number()
        .optional()
        .describe(
          "Position in the timeline (if omitted, will be added to the end)",
        ),
    }),
    execute: async ({ projectId, name, description, orderIndex }) => {
      try {
        let finalIndex = orderIndex;
        if (finalIndex === undefined) {
          const existing =
            await MilestoneService.getProjectMilestones(projectId);
          finalIndex =
            existing.length > 0
              ? Math.max(...existing.map((m) => m.order_index)) + 1
              : 1;
        }

        const result = await MilestoneService.createMilestone({
          project_id: projectId,
          name,
          description: description || "",
          status: "pending",
          order_index: finalIndex,
        });

        return {
          message: `Custom milestone "**${name}**" added successfully at position ${finalIndex}.`,
          milestone: result,
        };
      } catch (error) {
        return `Failed to create milestone: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  }),

  manageMilestone: tool({
    description:
      "Update a project milestone status (pending, current, completed). Use this to track project progress through phases.",
    parameters: z.object({
      projectId: z.string().describe("The ID of the project"),
      milestoneId: z.string().describe("The ID of the milestone to update"),
      status: z
        .enum(["pending", "current", "completed"])
        .describe("The new status of the milestone"),
    }),
    execute: async ({ milestoneId, status }) => {
      try {
        const result = await MilestoneService.updateMilestoneStatus(
          milestoneId,
          status,
        );
        return {
          message: `Milestone "${result.name}" updated to **${status}**. Project progress has been recalculated.`,
          milestone: result,
        };
      } catch (error) {
        return `Failed to update milestone: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  }),

  manageRaid: tool({
    description:
      "Create or update RAID items (Risk, Action Item, Issue, Decision Point).",
    parameters: z.object({
      projectId: z.string().describe("The ID of the project"),
      type: z
        .enum(["risk", "action_item", "issue", "decision_point"])
        .describe("The type of RAID item"),
      description: z.string().describe("Description of the RAID item"),
      priority: z.enum(["high", "medium", "low"]).default("medium"),
      status: z.string().default("open"),
      assignedTo: z
        .string()
        .optional()
        .describe("Employee ID assigned to this item"),
    }),
    execute: async ({
      projectId,
      type,
      description,
      priority,
      status,
      assignedTo,
    }) => {
      try {
        const result = await RaidService.createRaidItem({
          project_id: projectId,
          type,
          description,
          priority,
          status,
          assigned_to: assignedTo || null,
        });
        return {
          message: `New **${type.replace("_", " ")}** added to project: "${description}"`,
          raidItem: result,
        };
      } catch (error) {
        return `Failed to manage RAID item: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  }),

  getProjectRaid: tool({
    description:
      "Fetch the RAID log (Risks, Action Items, Issues, Decision Points) for a project. Can filter by type.",
    parameters: z.object({
      projectId: z.string().describe("The ID of the project"),
      type: z
        .enum(["risk", "action_item", "issue", "decision_point"])
        .optional()
        .describe("Filter by specific RAID type"),
    }),
    execute: async ({ projectId, type }) => {
      try {
        const items = await RaidService.getProjectRaid(projectId, type as any);
        if (items.length === 0) {
          return `No **${type || "RAID"}** items found for this project.`;
        }

        const summary = items
          .map(
            (item) =>
              `[${item.type.toUpperCase()}] (${item.priority.toUpperCase()}) Status: ${item.status} - ${item.description}`,
          )
          .join("\n");

        return {
          message: `Found ${items.length} RAID item(s).`,
          items,
          summary,
        };
      } catch (error) {
        return `Failed to fetch RAID log: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  }),

  getProjectTimeline: tool({
    description: "Get the current milestone and full timeline for a project.",
    parameters: z.object({
      projectId: z.string().describe("The ID of the project"),
    }),
    execute: async ({ projectId }) => {
      try {
        const [milestones, allTasks] = await Promise.all([
          MilestoneService.getProjectMilestones(projectId),
          fetchFromDatabase("tasks", { projectid: projectId }),
        ]);

        const current = milestones.find((m) => m.status === "current");
        const completed = milestones.filter((m) => m.status === "completed");

        const timelineParts = milestones.map((m) => {
          const statusIcon =
            m.status === "completed"
              ? "✅"
              : m.status === "current"
                ? "➡️"
                : "🕒";
          const tasks = (allTasks as any[]).filter(
            (t) => t.milestone_id === m.id,
          );
          const taskList =
            tasks.length > 0
              ? `\n    └─ Tasks: ${tasks.map((t) => `${t.status === "completed" ? "✓" : "•"} ${t.title}`).join(", ")}`
              : "\n    └─ No tasks assigned";

          return `${statusIcon} **${m.name}** (Status: ${m.status})${taskList}`;
        });

        const timelineStr = timelineParts.join("\n\n");

        return {
          message: `The project is currently in the **${current?.name || "Initialization"}** phase.`,
          currentMilestone: current?.name || "None",
          milestoneId: current?.id,
          progressSummary: `${completed.length} of ${milestones.length} milestones reached.`,
          timeline: timelineStr,
        };
      } catch (error) {
        return `Failed to fetch project timeline: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  }),
};

export async function POST(request: NextRequest) {
  const LONGCAT_API_KEY = process.env.LONGCAT_API_KEY;

  if (!LONGCAT_API_KEY) {
    const errorResponse: ApiResponse = {
      code: "MISSING_API_KEY",
      message: "LONGCAT_API_KEY environment variable is not configured",
    };
    return NextResponse.json(errorResponse, {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const longcat = createOpenAI({
    name: "longcat",
    apiKey: LONGCAT_API_KEY,
    baseURL: "https://api.longcat.chat/openai/v1",
  });

  try {
    const body = await request.json();

    if (!Array.isArray(body.messages)) {
      const errorResponse: ApiResponse = {
        code: "VALIDATION_ERROR",
        message: "messages must be an array",
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract the last user message to build context
    const lastUserMessage = body.messages
      .filter((msg: any) => msg.role === "user")
      .slice(-1)[0];
    const userQuery = lastUserMessage?.content;

    // Build enhanced context from database
    const contextString = await buildEnhancedContext(userQuery);

    // Check for report intent
    const intent = detectQueryIntent(userQuery || "");
    let reportContext = "";
    if (intent === "report") {
      reportContext =
        "\n\nAvailable report types:\n- employee_summary: Overview of all employees with department breakdown\n- project_status: Project and task completion status\n- task_overview: Task status breakdown and overdue analysis\n- workload_analysis: Employee task and project workload distribution\n- custom: Custom data query report\n\nWhen the user asks for a report, summary, or export, use the generateReport tool.";
    }

    // Inject context into system message with tool descriptions
    const systemPrompt =
      `You are EnochAI a helpful assistant for a project management system. When providing information about employees, projects, or tasks, only include names, roles, departments, skills, and other relevant details. Never include database IDs in your responses.

You have access to tools to create employees, projects, tasks; manage project milestones and RAID items (Risks, Action Items, Issues, Decision Points); assign employees to tasks and projects; update existing tasks and projects; search employees by skills, department, or role; and generate reports. When the user asks to perform these actions, use the appropriate tools.

IMPORTANT GUIDELINES:
1. **Milestone-Based Progress**: Projects are no longer measured by raw percentages but by milestones (e.g., Kick Off, UAT, Deployment). Use \`getProjectTimeline\` to see progress, \`manageMilestone\` to advance through phases, and \`createMilestone\` if the user wants to add custom phases unique to their project.
2. **RAID Management**: Use \`manageRaid\` to track Risks, Action Items, Issues, and Decision Points for any project. Use \`getProjectRaid\` to view the existing RAID log and status.
3. When creating entities (employees, projects, tasks), the tools will return both the ID and human-friendly details. Use the ID for subsequent tool calls, but use the names/titles when confirming to the user.
4. For assigning employees to tasks or projects, you can use the ID directly from a preceding creation step instead of calling getEmployeeId/getTaskId again.
5. Always provide a clear, human-friendly confirmation message using entity names, never showing UUIDs to the user.
6. When searching for entities, getEmployeeId/getProjectId/getTaskId accept names OR IDs. Use exact ID strings for precise lookups, partial names for fuzzy matching.
7. Use case-insensitive partial matching for all searches (e.g., "cs" matches "Computer Science").
8. When looking for employees with specific skills or in specific departments, use searchEmployeesByAttribute instead of listing all employees.
9. The context provided includes relational data: employee workload/task counts, project team members, and task assignee names. Use this information to provide comprehensive answers without extra tool calls.
10. When the user asks for a report, summary, or export, use the generateReport tool with the appropriate report type.` +
      reportContext +
      (contextString ? "\n\n" + contextString : "");

    const messagesWithContext = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...body.messages,
    ];

    const result = await streamText({
      model: longcat("LongCat-Flash-Chat"),
      messages: messagesWithContext,
      temperature: STREAMING_CONFIG.temperature,
      maxTokens: STREAMING_CONFIG.maxTokens,
      topP: STREAMING_CONFIG.topP,
      tools,
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
