# React Component Editor

A powerful visual editor for React components that allows you to edit components by clicking on elements and modifying their properties in real-time. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Core Functionality
- **Visual Component Editing**: Click on any element in the preview to select and edit it
- **Property Panel**: Edit text content, CSS classes, colors, and other properties
- **Real-time Preview**: See changes instantly as you edit
- **Code View**: Switch between visual and code editor modes
- **Auto-save**: Changes are automatically saved to the backend

### Supported Editable Properties
- Text content
- CSS classes (with quick style helpers)
- Colors (with color picker)
- Font weights and sizes
- Custom properties

### API Endpoints
- `POST /api/component` - Create a new component
- `GET /api/component/:id` - Get a specific component
- `PUT /api/component/:id` - Update a component
- `GET /api/preview/:id` - Preview a component

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

### Basic Usage

```tsx
import { WebsiteEditor } from '@/components/WebsiteEditor';

function App() {
  const handleSave = (componentData) => {
    console.log('Component saved:', componentData);
  };

  const sampleComponent = (
    <div className="p-4 bg-white rounded-lg">
      <h1 className="text-2xl font-bold">Hello World</h1>
      <p className="text-gray-600">Click to edit me!</p>
    </div>
  );

  return (
    <WebsiteEditor 
      component={sampleComponent}
      onSave={handleSave}
    />
  );
}
```

### How to Use the Editor

1. **Visual Mode**: Click on any element in the preview to select it
2. **Property Panel**: Use the right sidebar to edit properties like text, colors, and styles
3. **Code Mode**: Switch to the code tab to edit the raw JSX
4. **Auto-save**: Changes are automatically saved every second
5. **Quick Styles**: Use the property panel's quick style buttons for common changes

### API Usage

```typescript
// Save a component
const response = await fetch('/api/component', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Component',
    code: '<div>Hello World</div>',
    serializedComponent: { /* serialized data */ }
  })
});

// Load a component
const component = await fetch('/api/component/123').then(res => res.json());

// Preview a component
window.open(`/preview/${componentId}`, '_blank');
```

## Architecture

The editor consists of several key components:

- **WebsiteEditor**: Main orchestrator component
- **VisualEditor**: Interactive component renderer
- **CodeEditor**: Syntax-highlighted code editor
- **PropertyPanel**: Property editing interface
- **API Routes**: Backend for component persistence

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
