const { fetchFromDatabase } = require("./database-helper");

async function buildKnowledgeContext(context) {
  const contextParts = [];

  if (context.projectId) {
    const projects = await fetchFromDatabase("projects", {
      id: context.projectId,
    });
    if (projects.length > 0) {
      const project = projects[0];
      contextParts.push(`Project: ${project.name} (ID: ${project.id})`);
      contextParts.push(`  Description: ${project.description}`);
      contextParts.push(`  Status: ${project.status}`);
      contextParts.push(`  Dates: ${project.startDate} to ${project.endDate}`);
    }
  }
  if (context.employeeId) {
    const employees = await fetchFromDatabase("employees", {
      id: context.employeeId,
    });
    if (employees.length > 0) {
      const employee = employees[0];
      contextParts.push(`Employee: ${employee.name} (ID: ${employee.id})`);
      contextParts.push(`  Email: ${employee.email}`);
      contextParts.push(`  Role: ${employee.role}`);
      contextParts.push(`  Department: ${employee.department}`);
      contextParts.push(`  Assigned Projects: ${employee.projects.join(", ")}`);
    }
  }
  if (context.taskId) {
    const tasks = await fetchFromDatabase("tasks", { id: context.taskId });
    if (tasks.length > 0) {
      const task = tasks[0];
      contextParts.push(`Task: ${task.title} (ID: ${task.id})`);
      contextParts.push(`  Description: ${task.description}`);
      contextParts.push(`  Status: ${task.status}`);
      contextParts.push(`  Project ID: ${task.projectId}`);
      contextParts.push(`  Assigned To: ${task.assignedTo}`);
      contextParts.push(`  Due Date: ${task.dueDate}`);
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

    const contextString = await buildKnowledgeContext(queryContext);

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
