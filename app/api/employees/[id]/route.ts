import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteEmployee, updateEmployee } from '@/lib/services/employeeService';
import { handleApiError } from '@/lib/utils/api-handler';

// Zod schema for employee updates - partial and omits immutable fields
const EmployeeUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.string().min(1, 'Role is required').optional(),
  department: z.string().min(1, 'Department is required').optional(),
  skills: z.array(z.string()).optional(),
}).strict();

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = EmployeeUpdateSchema.parse(body);
    const updatedEmployee = await updateEmployee(id, validatedData);

    return NextResponse.json(updatedEmployee, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const deletedEmployee = await deleteEmployee(id);

    return NextResponse.json(deletedEmployee, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
