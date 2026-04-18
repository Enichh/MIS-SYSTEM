import { fetchFromDatabase, insertToDatabase, deleteFromDatabase } from '@/lib/utils/database'

export interface EmployeeProject {
  employee_id: string;
  project_id: string;
  created_at: string;
}

/**
 * Fetches all employee-project relationships
 * @param filters - Optional filters (employee_id, project_id)
 * @returns Array of employee-project relationships
 */
export async function getEmployeeProjects(filters?: Record<string, unknown>): Promise<EmployeeProject[]> {
  return fetchFromDatabase<EmployeeProject>('employee_projects', filters);
}

/**
 * Assigns an employee to a project
 * @param employeeId - The employee ID
 * @param projectId - The project ID
 * @returns The created employee-project relationship
 */
export async function assignEmployeeToProject(employeeId: string, projectId: string): Promise<EmployeeProject> {
  console.log(`[PROJECT_ASSIGN] Assigning employee ${employeeId} to project ${projectId}`);
  
  try {
    // Verify employee exists
    const employees = await fetchFromDatabase('employees', { id: employeeId });
    if (!employees || employees.length === 0) {
      console.log(`[PROJECT_ASSIGN] Failed: Employee ${employeeId} not found`);
      throw new Error(`Employee with ID ${employeeId} not found`);
    }

    const employeeName = (employees[0] as any).name;
    console.log(`[PROJECT_ASSIGN] Employee found: ${employeeName} (ID: ${employeeId})`);

    // Verify project exists
    const projects = await fetchFromDatabase('projects', { id: projectId });
    if (!projects || projects.length === 0) {
      console.log(`[PROJECT_ASSIGN] Failed: Project ${projectId} not found`);
      throw new Error(`Project with ID ${projectId} not found`);
    }

    const projectName = (projects[0] as any).name;
    console.log(`[PROJECT_ASSIGN] Project found: ${projectName} (ID: ${projectId})`);

    // Check if assignment already exists
    const existingAssignments = await fetchFromDatabase('employee_projects', {
      employee_id: employeeId,
      project_id: projectId
    });

    if (existingAssignments && existingAssignments.length > 0) {
      console.log(`[PROJECT_ASSIGN] Assignment already exists: Employee ${employeeName} already assigned to project ${projectName}`);
      return existingAssignments[0] as EmployeeProject;
    }

    // Create the assignment
    const result = await insertToDatabase<EmployeeProject>('employee_projects', {
      employee_id: employeeId,
      project_id: projectId
    });

    console.log(`[PROJECT_ASSIGN] Successfully assigned employee ${employeeName} to project ${projectName}`);
    return result;
  } catch (error) {
    console.log(`[PROJECT_ASSIGN] Failed to assign employee ${employeeId} to project ${projectId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Removes an employee from a project
 * @param employeeId - The employee ID
 * @param projectId - The project ID
 * @returns The deleted employee-project relationship
 */
export async function removeEmployeeFromProject(employeeId: string, projectId: string): Promise<EmployeeProject> {
  console.log(`[PROJECT_REMOVE] Removing employee ${employeeId} from project ${projectId}`);
  
  try {
    // Since employee_projects has a composite primary key, we need to delete by both keys
    const supabase = await (await import('../supabase/server')).createClient();
    const { data, error } = await supabase
      .from('employee_projects')
      .delete()
      .eq('employee_id', employeeId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      console.log(`[PROJECT_REMOVE] Failed: ${error.message}`);
      throw new Error(`Failed to remove employee from project: ${error.message}`);
    }

    console.log(`[PROJECT_REMOVE] Successfully removed employee ${employeeId} from project ${projectId}`);
    return data as EmployeeProject;
  } catch (error) {
    console.log(`[PROJECT_REMOVE] Failed to remove employee ${employeeId} from project ${projectId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}
