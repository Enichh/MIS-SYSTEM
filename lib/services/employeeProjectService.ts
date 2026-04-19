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
 * @param employee_id - The employee ID
 * @param project_id - The project ID
 * @returns The created employee-project relationship
 */
export async function assignEmployeeToProject(employee_id: string, project_id: string): Promise<EmployeeProject> {
  console.log(`[PROJECT_ASSIGN] Assigning employee ${employee_id} to project ${project_id}`);
  
  try {
    // Verify employee exists
    const employees = await fetchFromDatabase('employees', { id: employee_id });
    if (!employees || employees.length === 0) {
      console.log(`[PROJECT_ASSIGN] Failed: Employee ${employee_id} not found`);
      throw new Error(`Employee with ID ${employee_id} not found`);
    }

    const employeeName = (employees[0] as any).name;
    console.log(`[PROJECT_ASSIGN] Employee found: ${employeeName} (ID: ${employee_id})`);

    // Verify project exists
    const projects = await fetchFromDatabase('projects', { id: project_id });
    if (!projects || projects.length === 0) {
      console.log(`[PROJECT_ASSIGN] Failed: Project ${project_id} not found`);
      throw new Error(`Project with ID ${project_id} not found`);
    }

    const projectName = (projects[0] as any).name;
    console.log(`[PROJECT_ASSIGN] Project found: ${projectName} (ID: ${project_id})`);

    // Check if assignment already exists
    const existingAssignments = await fetchFromDatabase('employee_projects', {
      employee_id: employee_id,
      project_id: project_id
    });

    if (existingAssignments && existingAssignments.length > 0) {
      console.log(`[PROJECT_ASSIGN] Assignment already exists: Employee ${employeeName} already assigned to project ${projectName}`);
      return existingAssignments[0] as EmployeeProject;
    }

    // Create the assignment
    const result = await insertToDatabase<EmployeeProject>('employee_projects', {
      employee_id: employee_id,
      project_id: project_id
    });

    console.log(`[PROJECT_ASSIGN] Successfully assigned employee ${employeeName} to project ${projectName}`);
    return result;
  } catch (error) {
    console.log(`[PROJECT_ASSIGN] Failed to assign employee ${employee_id} to project ${project_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Removes an employee from a project
 * @param employee_id - The employee ID
 * @param project_id - The project ID
 * @returns The deleted employee-project relationship
 */
export async function removeEmployeeFromProject(employee_id: string, project_id: string): Promise<EmployeeProject> {
  console.log(`[PROJECT_REMOVE] Removing employee ${employee_id} from project ${project_id}`);
  
  try {
    // Since employee_projects has a composite primary key, we need to delete by both keys
    const supabase = await (await import('../supabase/server')).createClient();
    const { data, error } = await supabase
      .from('employee_projects')
      .delete()
      .eq('employee_id', employee_id)
      .eq('project_id', project_id)
      .select()
      .single();

    if (error) {
      console.log(`[PROJECT_REMOVE] Failed: ${error.message}`);
      throw new Error(`Failed to remove employee from project: ${error.message}`);
    }

    console.log(`[PROJECT_REMOVE] Successfully removed employee ${employee_id} from project ${project_id}`);
    return data as EmployeeProject;
  } catch (error) {
    console.log(`[PROJECT_REMOVE] Failed to remove employee ${employee_id} from project ${project_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}
