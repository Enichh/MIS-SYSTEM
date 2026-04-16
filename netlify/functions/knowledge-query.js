function buildKnowledgeContext(context) {
  const contextParts = [];

  if (context.projectId) {
    contextParts.push(`Project ID: ${context.projectId}`);
  }
  if (context.employeeId) {
    contextParts.push(`Employee ID: ${context.employeeId}`);
  }
  if (context.taskId) {
    contextParts.push(`Task ID: ${context.taskId}`);
  }

  return contextParts.join("\n");
}

async function knowledgeQueryHandler(event, context) {
  const { LONGCAT_API_KEY } = process.env;

  if (!LONGCAT_API_KEY) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "MISSING_API_KEY",
        message: "LONGCAT_API_KEY environment variable is not configured",
      }),
    };
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

    const contextString = buildKnowledgeContext(queryContext);

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
