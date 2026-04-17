import { NextRequest, NextResponse } from 'next/server';
import { deleteEmployee } from '@/lib/services/employeeService';
import { handleApiError } from '@/lib/utils/api-handler';

export const dynamic = 'force-dynamic';

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
