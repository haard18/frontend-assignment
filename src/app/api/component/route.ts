import { NextRequest, NextResponse } from 'next/server';
import { saveComponent, getAllComponents } from '@/lib/storage';
import { ComponentData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const componentData: ComponentData = await request.json();
    
    if (!componentData.name || !componentData.code) {
      return NextResponse.json(
        { error: 'Component name and code are required' },
        { status: 400 }
      );
    }

    const savedComponent = saveComponent({
      ...componentData,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(savedComponent, { status: 201 });
  } catch (error) {
    console.error('Error saving component:', error);
    return NextResponse.json(
      { error: 'Failed to save component' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const components = getAllComponents();
    
    // Filter components by userId if provided
    const filteredComponents = userId 
      ? components.filter(component => component.userId === userId)
      : components;
    
    return NextResponse.json({ components: filteredComponents });
  } catch (error) {
    console.error('Error getting components:', error);
    return NextResponse.json(
      { error: 'Failed to get components' },
      { status: 500 }
    );
  }
}
