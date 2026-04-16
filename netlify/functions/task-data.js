const { fetchFromDatabase } = require('./database-helper');

async function taskDataHandler(event, context) {
  try {
    const queryStringParameters = event.queryStringParameters || {};
    
    const tasks = await fetchFromDatabase('tasks', queryStringParameters);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tasks)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'INTERNAL_ERROR',
        message: error.message
      })
    };
  }
}

exports.handler = taskDataHandler;
