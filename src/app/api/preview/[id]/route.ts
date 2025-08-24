import { NextRequest, NextResponse } from 'next/server';
import { getComponent } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const component = getComponent(id);
    
    if (!component) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }

    // Return the component for preview
    return NextResponse.json({
      id: component.id,
      name: component.name,
      code: component.code,
      serializedComponent: component.serializedComponent,
      updatedAt: component.updatedAt,
    });
  } catch (error) {
    console.error('Error getting component preview:', error);
    return NextResponse.json(
      { error: 'Failed to get component preview' },
      { status: 500 }
    );
  }
}
