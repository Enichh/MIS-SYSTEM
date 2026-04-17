import { mockData } from '../data/mockData';

export async function fetchFromDatabase(
  storeName: string,
  filters: Record<string, unknown> = {}
): Promise<unknown[]> {
  const data = mockData[storeName as keyof typeof mockData] || [];

  let result = Array.isArray(data) ? [...data] : [];

  if (filters.id) {
    result = result.filter((item: any) => item.id === filters.id);
  }
  if (filters.status) {
    result = result.filter((item: any) => item.status === filters.status);
  }
  if (filters.projectId) {
    result = result.filter((item: any) => item.projectId === filters.projectId);
  }
  if (filters.assignedTo) {
    result = result.filter((item: any) => item.assignedTo === filters.assignedTo);
  }

  return result;
}
