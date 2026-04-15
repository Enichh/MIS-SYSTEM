/**
 * @fileoverview IndexedDB database operations for Enosoft Project Management System
 * @module shared/database
 */

// Type definitions are in JSDoc comments - no runtime imports needed

/**
 * Database name constant
 * @constant {string}
 */
export const DB_NAME = "enosoft_pms";

/**
 * Database version constant
 * @constant {number}
 */
export const DB_VERSION = 1;

/**
 * Employees object store name
 * @constant {string}
 */
export const STORE_EMPLOYEES = "employees";

/**
 * Projects object store name
 * @constant {string}
 */
export const STORE_PROJECTS = "projects";

/**
 * Tasks object store name
 * @constant {string}
 */
export const STORE_TASKS = "tasks";

/**
 * Opens or creates the IndexedDB database with proper schema
 * @returns {Promise<IDBDatabase>} Resolves to the database instance
 * @throws {Error} If database opening fails
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create employees store with indexes
      if (!db.objectStoreNames.contains(STORE_EMPLOYEES)) {
        const employeeStore = db.createObjectStore(STORE_EMPLOYEES, {
          keyPath: "id",
        });
        employeeStore.createIndex("email", "email", { unique: true });
        employeeStore.createIndex("workType", "workType", { unique: false });
      }

      // Create projects store with indexes
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const projectStore = db.createObjectStore(STORE_PROJECTS, {
          keyPath: "id",
        });
        projectStore.createIndex("status", "status", { unique: false });
      }

      // Create tasks store with indexes
      if (!db.objectStoreNames.contains(STORE_TASKS)) {
        const taskStore = db.createObjectStore(STORE_TASKS, { keyPath: "id" });
        taskStore.createIndex("projectId", "projectId", { unique: false });
        taskStore.createIndex("status", "status", { unique: false });
      }
    };
  });
}

/**
 * Creates a new employee in the database
 * @param {Employee} employee - The employee object to create
 * @returns {Promise<string>} Resolves to the employee ID
 * @throws {Error} If creation fails
 */
async function createEmployee(employee) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_EMPLOYEES], "readwrite");
    const store = transaction.objectStore(STORE_EMPLOYEES);

    return new Promise((resolve, reject) => {
      const request = store.add(employee);

      request.onsuccess = () => resolve(employee.id);
      request.onerror = () =>
        reject(new Error(`Failed to create employee: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`createEmployee error: ${error.message}`);
  }
}

/**
 * Retrieves an employee by ID
 * @param {string} id - The employee ID
 * @returns {Promise<Employee|null>} Resolves to the employee object or null if not found
 * @throws {Error} If retrieval fails
 */
async function getEmployee(id) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_EMPLOYEES], "readonly");
    const store = transaction.objectStore(STORE_EMPLOYEES);

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () =>
        reject(new Error(`Failed to get employee: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`getEmployee error: ${error.message}`);
  }
}

/**
 * Updates an existing employee in the database
 * @param {Employee} employee - The employee object to update
 * @returns {Promise<void>} Resolves when update is complete
 * @throws {Error} If update fails
 */
async function updateEmployee(employee) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_EMPLOYEES], "readwrite");
    const store = transaction.objectStore(STORE_EMPLOYEES);

    return new Promise((resolve, reject) => {
      const request = store.put(employee);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to update employee: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`updateEmployee error: ${error.message}`);
  }
}

/**
 * Deletes an employee by ID
 * @param {string} id - The employee ID
 * @returns {Promise<void>} Resolves when deletion is complete
 * @throws {Error} If deletion fails
 */
async function deleteEmployee(id) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_EMPLOYEES], "readwrite");
    const store = transaction.objectStore(STORE_EMPLOYEES);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to delete employee: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`deleteEmployee error: ${error.message}`);
  }
}

/**
 * Retrieves all employees from the database
 * @returns {Promise<Employee[]>} Resolves to array of all employees
 * @throws {Error} If retrieval fails
 */
async function getAllEmployees() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_EMPLOYEES], "readonly");
    const store = transaction.objectStore(STORE_EMPLOYEES);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () =>
        reject(new Error(`Failed to get all employees: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`getAllEmployees error: ${error.message}`);
  }
}

/**
 * Creates a new project in the database
 * @param {Project} project - The project object to create
 * @returns {Promise<string>} Resolves to the project ID
 * @throws {Error} If creation fails
 */
async function createProject(project) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_PROJECTS], "readwrite");
    const store = transaction.objectStore(STORE_PROJECTS);

    return new Promise((resolve, reject) => {
      const request = store.add(project);

      request.onsuccess = () => resolve(project.id);
      request.onerror = () =>
        reject(new Error(`Failed to create project: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`createProject error: ${error.message}`);
  }
}

/**
 * Retrieves a project by ID
 * @param {string} id - The project ID
 * @returns {Promise<Project|null>} Resolves to the project object or null if not found
 * @throws {Error} If retrieval fails
 */
async function getProject(id) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_PROJECTS], "readonly");
    const store = transaction.objectStore(STORE_PROJECTS);

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () =>
        reject(new Error(`Failed to get project: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`getProject error: ${error.message}`);
  }
}

/**
 * Updates an existing project in the database
 * @param {Project} project - The project object to update
 * @returns {Promise<void>} Resolves when update is complete
 * @throws {Error} If update fails
 */
async function updateProject(project) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_PROJECTS], "readwrite");
    const store = transaction.objectStore(STORE_PROJECTS);

    return new Promise((resolve, reject) => {
      const request = store.put(project);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to update project: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`updateProject error: ${error.message}`);
  }
}

/**
 * Deletes a project by ID
 * @param {string} id - The project ID
 * @returns {Promise<void>} Resolves when deletion is complete
 * @throws {Error} If deletion fails
 */
async function deleteProject(id) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_PROJECTS], "readwrite");
    const store = transaction.objectStore(STORE_PROJECTS);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to delete project: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`deleteProject error: ${error.message}`);
  }
}

/**
 * Retrieves all projects from the database
 * @returns {Promise<Project[]>} Resolves to array of all projects
 * @throws {Error} If retrieval fails
 */
async function getAllProjects() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_PROJECTS], "readonly");
    const store = transaction.objectStore(STORE_PROJECTS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () =>
        reject(new Error(`Failed to get all projects: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`getAllProjects error: ${error.message}`);
  }
}

/**
 * Creates a new task in the database
 * @param {Task} task - The task object to create
 * @returns {Promise<string>} Resolves to the task ID
 * @throws {Error} If creation fails
 */
async function createTask(task) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_TASKS], "readwrite");
    const store = transaction.objectStore(STORE_TASKS);

    return new Promise((resolve, reject) => {
      const request = store.add(task);

      request.onsuccess = () => resolve(task.id);
      request.onerror = () =>
        reject(new Error(`Failed to create task: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`createTask error: ${error.message}`);
  }
}

/**
 * Retrieves a task by ID
 * @param {string} id - The task ID
 * @returns {Promise<Task|null>} Resolves to the task object or null if not found
 * @throws {Error} If retrieval fails
 */
async function getTask(id) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_TASKS], "readonly");
    const store = transaction.objectStore(STORE_TASKS);

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () =>
        reject(new Error(`Failed to get task: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`getTask error: ${error.message}`);
  }
}

/**
 * Updates an existing task in the database
 * @param {Task} task - The task object to update
 * @returns {Promise<void>} Resolves when update is complete
 * @throws {Error} If update fails
 */
async function updateTask(task) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_TASKS], "readwrite");
    const store = transaction.objectStore(STORE_TASKS);

    return new Promise((resolve, reject) => {
      const request = store.put(task);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to update task: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`updateTask error: ${error.message}`);
  }
}

/**
 * Deletes a task by ID
 * @param {string} id - The task ID
 * @returns {Promise<void>} Resolves when deletion is complete
 * @throws {Error} If deletion fails
 */
async function deleteTask(id) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_TASKS], "readwrite");
    const store = transaction.objectStore(STORE_TASKS);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to delete task: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`deleteTask error: ${error.message}`);
  }
}

/**
 * Retrieves all tasks from the database
 * @returns {Promise<Task[]>} Resolves to array of all tasks
 * @throws {Error} If retrieval fails
 */
async function getAllTasks() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_TASKS], "readonly");
    const store = transaction.objectStore(STORE_TASKS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () =>
        reject(new Error(`Failed to get all tasks: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`getAllTasks error: ${error.message}`);
  }
}

/**
 * Assigns an employee to a project
 * Updates both the employee's assignedProjects array and the project's assignedEmployees array
 * @param {string} employeeId - The employee ID
 * @param {string} projectId - The project ID
 * @returns {Promise<void>} Resolves when assignment is complete
 * @throws {Error} If assignment fails
 */
async function assignEmployeeToProject(employeeId, projectId) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(
      [STORE_EMPLOYEES, STORE_PROJECTS],
      "readwrite",
    );
    const employeeStore = transaction.objectStore(STORE_EMPLOYEES);
    const projectStore = transaction.objectStore(STORE_PROJECTS);

    return new Promise((resolve, reject) => {
      const employeeRequest = employeeStore.get(employeeId);
      const projectRequest = projectStore.get(projectId);

      employeeRequest.onerror = () =>
        reject(new Error(`Failed to get employee: ${employeeRequest.error}`));
      projectRequest.onerror = () =>
        reject(new Error(`Failed to get project: ${projectRequest.error}`));

      employeeRequest.onsuccess = () => {
        const employee = employeeRequest.result;
        if (!employee) {
          reject(new Error("Employee not found"));
          return;
        }

        if (!employee.assignedProjects.includes(projectId)) {
          employee.assignedProjects.push(projectId);
          employee.updatedAt = Date.now();
          employeeStore.put(employee);
        }
      };

      projectRequest.onsuccess = () => {
        const project = projectRequest.result;
        if (!project) {
          reject(new Error("Project not found"));
          return;
        }

        if (!project.assignedEmployees.includes(employeeId)) {
          project.assignedEmployees.push(employeeId);
          project.updatedAt = Date.now();
          projectStore.put(project);
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          new Error(`Assignment transaction failed: ${transaction.error}`),
        );
    });
  } catch (error) {
    throw new Error(`assignEmployeeToProject error: ${error.message}`);
  }
}

/**
 * Assigns an employee to a task
 * Updates both the employee's assignedTasks array and the task's assignedEmployees array
 * @param {string} employeeId - The employee ID
 * @param {string} taskId - The task ID
 * @returns {Promise<void>} Resolves when assignment is complete
 * @throws {Error} If assignment fails
 */
async function assignEmployeeToTask(employeeId, taskId) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(
      [STORE_EMPLOYEES, STORE_TASKS],
      "readwrite",
    );
    const employeeStore = transaction.objectStore(STORE_EMPLOYEES);
    const taskStore = transaction.objectStore(STORE_TASKS);

    return new Promise((resolve, reject) => {
      const employeeRequest = employeeStore.get(employeeId);
      const taskRequest = taskStore.get(taskId);

      employeeRequest.onerror = () =>
        reject(new Error(`Failed to get employee: ${employeeRequest.error}`));
      taskRequest.onerror = () =>
        reject(new Error(`Failed to get task: ${taskRequest.error}`));

      employeeRequest.onsuccess = () => {
        const employee = employeeRequest.result;
        if (!employee) {
          reject(new Error("Employee not found"));
          return;
        }

        if (!employee.assignedTasks.includes(taskId)) {
          employee.assignedTasks.push(taskId);
          employee.updatedAt = Date.now();
          employeeStore.put(employee);
        }
      };

      taskRequest.onsuccess = () => {
        const task = taskRequest.result;
        if (!task) {
          reject(new Error("Task not found"));
          return;
        }

        if (!task.assignedEmployees.includes(employeeId)) {
          task.assignedEmployees.push(employeeId);
          task.updatedAt = Date.now();
          taskStore.put(task);
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          new Error(`Assignment transaction failed: ${transaction.error}`),
        );
    });
  } catch (error) {
    throw new Error(`assignEmployeeToTask error: ${error.message}`);
  }
}

/**
 * Removes an employee from a project
 * Updates both the employee's assignedProjects array and the project's assignedEmployees array
 * @param {string} employeeId - The employee ID
 * @param {string} projectId - The project ID
 * @returns {Promise<void>} Resolves when removal is complete
 * @throws {Error} If removal fails
 */
async function removeEmployeeFromProject(employeeId, projectId) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(
      [STORE_EMPLOYEES, STORE_PROJECTS],
      "readwrite",
    );
    const employeeStore = transaction.objectStore(STORE_EMPLOYEES);
    const projectStore = transaction.objectStore(STORE_PROJECTS);

    return new Promise((resolve, reject) => {
      const employeeRequest = employeeStore.get(employeeId);
      const projectRequest = projectStore.get(projectId);

      employeeRequest.onerror = () =>
        reject(new Error(`Failed to get employee: ${employeeRequest.error}`));
      projectRequest.onerror = () =>
        reject(new Error(`Failed to get project: ${projectRequest.error}`));

      employeeRequest.onsuccess = () => {
        const employee = employeeRequest.result;
        if (!employee) {
          reject(new Error("Employee not found"));
          return;
        }

        const index = employee.assignedProjects.indexOf(projectId);
        if (index > -1) {
          employee.assignedProjects.splice(index, 1);
          employee.updatedAt = Date.now();
          employeeStore.put(employee);
        }
      };

      projectRequest.onsuccess = () => {
        const project = projectRequest.result;
        if (!project) {
          reject(new Error("Project not found"));
          return;
        }

        const index = project.assignedEmployees.indexOf(employeeId);
        if (index > -1) {
          project.assignedEmployees.splice(index, 1);
          project.updatedAt = Date.now();
          projectStore.put(project);
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(new Error(`Removal transaction failed: ${transaction.error}`));
    });
  } catch (error) {
    throw new Error(`removeEmployeeFromProject error: ${error.message}`);
  }
}

/**
 * Removes an employee from a task
 * Updates both the employee's assignedTasks array and the task's assignedEmployees array
 * @param {string} employeeId - The employee ID
 * @param {string} taskId - The task ID
 * @returns {Promise<void>} Resolves when removal is complete
 * @throws {Error} If removal fails
 */
async function removeEmployeeFromTask(employeeId, taskId) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(
      [STORE_EMPLOYEES, STORE_TASKS],
      "readwrite",
    );
    const employeeStore = transaction.objectStore(STORE_EMPLOYEES);
    const taskStore = transaction.objectStore(STORE_TASKS);

    return new Promise((resolve, reject) => {
      const employeeRequest = employeeStore.get(employeeId);
      const taskRequest = taskStore.get(taskId);

      employeeRequest.onerror = () =>
        reject(new Error(`Failed to get employee: ${employeeRequest.error}`));
      taskRequest.onerror = () =>
        reject(new Error(`Failed to get task: ${taskRequest.error}`));

      employeeRequest.onsuccess = () => {
        const employee = employeeRequest.result;
        if (!employee) {
          reject(new Error("Employee not found"));
          return;
        }

        const index = employee.assignedTasks.indexOf(taskId);
        if (index > -1) {
          employee.assignedTasks.splice(index, 1);
          employee.updatedAt = Date.now();
          employeeStore.put(employee);
        }
      };

      taskRequest.onsuccess = () => {
        const task = taskRequest.result;
        if (!task) {
          reject(new Error("Task not found"));
          return;
        }

        const index = task.assignedEmployees.indexOf(employeeId);
        if (index > -1) {
          task.assignedEmployees.splice(index, 1);
          task.updatedAt = Date.now();
          taskStore.put(task);
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(new Error(`Removal transaction failed: ${transaction.error}`));
    });
  } catch (error) {
    throw new Error(`removeEmployeeFromTask error: ${error.message}`);
  }
}

export {
  openDatabase,
  createEmployee,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  getAllEmployees,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getAllProjects,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getAllTasks,
  assignEmployeeToProject,
  assignEmployeeToTask,
  removeEmployeeFromProject,
  removeEmployeeFromTask,
};
