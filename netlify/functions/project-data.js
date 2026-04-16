const { fetchFromDatabase } = require('./database-helper');

async function projectDataHandler(event, context) {
  try {
    const queryStringParameters = event.queryStringParameters || {};
    
    const projects = await fetchFromDatabase('projects', queryStringParameters);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projects)
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

exports.handler = projectDataHandler;
