const { fetchFromDatabase } = require("./database-helper");

function detectQueryIntent(query) {
  const lowerQuery = (query || "").toLowerCase();
  const intent = {
    fetchEmployees: false,
    fetchTasks: false,
    fetchProjects: false,
  };

  if (
    lowerQuery.includes("employee") ||
    lowerQuery.includes("staff") ||
    lowerQuery.includes("team member") ||
    lowerQuery.includes("who are the") ||
    lowerQuery.includes("list employees") ||
    lowerQuery.includes("show employees")
  ) {
    intent.fetchEmployees = true;
  }

  if (
    lowerQuery.includes("task") ||
    lowerQuery.includes("todo") ||
    lowerQuery.includes("list tasks") ||
    lowerQuery.includes("show tasks") ||
    lowerQuery.includes("what tasks")
  ) {
    intent.fetchTasks = true;
  }

  if (
    lowerQuery.includes("project") ||
    lowerQuery.includes("list projects") ||
    lowerQuery.includes("show projects") ||
    lowerQuery.includes("what projects")
  ) {
    intent.fetchProjects = true;
  }

  return intent;
}

async function buildKnowledgeContext(context, query = "") {
  const contextParts = [];
  const intent = detectQueryIntent(query);

  if (context.projectId) {
    const projects = await fetchFromDatabase("projects", {
      id: context.projectId,
    });
    if (projects.length > 0) {
      const project = projects[0];
      contextParts.push(
        `Project: ${project.name || "Unknown"} (ID: ${project.id || "N/A"})`,
      );
      contextParts.push(
        `  Description: ${project.description || "No description"}`,
      );
      contextParts.push(`  Status: ${project.status || "Unknown"}`);
      contextParts.push(
        `  Dates: ${project.startDate || "N/A"} to ${project.endDate || "N/A"}`,
      );
    }
  }

  if (context.employeeId) {
    const employees = await fetchFromDatabase("employees", {
      id: context.employeeId,
    });
    if (employees.length > 0) {
      const employee = employees[0];
      contextParts.push(
        `Employee: ${employee.name || "Unknown"} (ID: ${employee.id || "N/A"})`,
      );
      contextParts.push(`  Email: ${employee.email || "No email"}`);
      contextParts.push(`  Role: ${employee.role || "Unknown"}`);
      contextParts.push(`  Department: ${employee.department || "Unknown"}`);
      contextParts.push(
        `  Assigned Projects: ${employee.projects?.join(", ") || "None"}`,
      );
    }
  }

  if (context.taskId) {
    const tasks = await fetchFromDatabase("tasks", { id: context.taskId });
    if (tasks.length > 0) {
      const task = tasks[0];
      contextParts.push(
        `Task: ${task.title || "Unknown"} (ID: ${task.id || "N/A"})`,
      );
      contextParts.push(
        `  Description: ${task.description || "No description"}`,
      );
      contextParts.push(`  Status: ${task.status || "Unknown"}`);
      contextParts.push(`  Project ID: ${task.projectId || "N/A"}`);
      contextParts.push(`  Assigned To: ${task.assignedTo || "Unassigned"}`);
      contextParts.push(`  Due Date: ${task.dueDate || "No due date"}`);
    }
  }

  if (intent.fetchEmployees && !context.employeeId) {
    const employees = await fetchFromDatabase("employees", {});
    if (employees.length > 0) {
      contextParts.push(`All Employees (${employees.length}):`);
      employees.forEach((emp) => {
        contextParts.push(
          `  - ${emp.name || "Unknown"} (ID: ${emp.id || "N/A"}, Role: ${emp.role || "Unknown"}, Department: ${emp.department || "Unknown"})`,
        );
      });
    } else {
      contextParts.push("No employees found in the system.");
    }
  }

  if (intent.fetchTasks && !context.taskId) {
    const tasks = await fetchFromDatabase("tasks", {});
    if (tasks.length > 0) {
      contextParts.push(`All Tasks (${tasks.length}):`);
      tasks.forEach((task) => {
        contextParts.push(
          `  - ${task.title || "Unknown"} (ID: ${task.id || "N/A"}, Status: ${task.status || "Unknown"}, Assigned To: ${task.assignedTo || "Unassigned"})`,
        );
      });
    } else {
      contextParts.push("No tasks found in the system.");
    }
  }

  if (intent.fetchProjects && !context.projectId) {
    const projects = await fetchFromDatabase("projects", {});
    if (projects.length > 0) {
      contextParts.push(`All Projects (${projects.length}):`);
      projects.forEach((proj) => {
        contextParts.push(
          `  - ${proj.name || "Unknown"} (ID: ${proj.id || "N/A"}, Status: ${proj.status || "Unknown"})`,
        );
      });
    } else {
      contextParts.push("No projects found in the system.");
    }
  }

  return contextParts.join("\n");
}

async function knowledgeQueryHandler(event, context) {
  console.log("[DEBUG] knowledgeQueryHandler called");
  console.log("[DEBUG] Event:", JSON.stringify(event));
  console.log(
    "[DEBUG] Available env vars:",
    Object.keys(process.env).filter(
      (k) => k.includes("API") || k.includes("KEY"),
    ),
  );

  const { LONGCAT_API_KEY } = process.env;
  console.log("[DEBUG] LONGCAT_API_KEY exists:", !!LONGCAT_API_KEY);

  if (!LONGCAT_API_KEY) {
    const errorResponse = {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "MISSING_API_KEY",
        message: "LONGCAT_API_KEY environment variable is not configured",
      }),
    };
    console.log("[DEBUG] Returning error:", JSON.stringify(errorResponse));
    return errorResponse;
  }

  try {
    const { query, context: queryContext = {} } = JSON.parse(event.body);

    if (!query) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: "MISSING_QUERY",
          message: "Query is required",
        }),
      };
    }

    const contextString = await buildKnowledgeContext(queryContext, query);

    const response = await fetch(
      "https://api.longcat.chat/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LONGCAT_API_KEY}`,
        },
        body: JSON.stringify({
          model: "LongCat-Flash-Chat",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant for a project management system." +
                contextString,
            },
            { role: "user", content: query },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `LONGCAT API error: ${response.status} ${errorData.message || response.statusText}`,
      );
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "No answer available";

    const knowledgeResponse = {
      answer,
      sources: [],
      confidence: 0.8,
      relatedEntities: queryContext || {},
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(knowledgeResponse),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "INTERNAL_ERROR",
        message: error.message,
      }),
    };
  }
}

exports.handler = knowledgeQueryHandler;
