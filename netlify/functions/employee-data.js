const { fetchFromDatabase } = require('./database-helper');

async function employeeDataHandler(event, context) {
  try {
    const queryStringParameters = event.queryStringParameters || {};
    
    const employees = await fetchFromDatabase('employees', queryStringParameters);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(employees)
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

exports.handler = employeeDataHandler;
