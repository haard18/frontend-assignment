import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import generate from '@babel/generator';
import { SerializedElement } from '@/types';

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function parseReactComponent(code: string): SerializedElement | null {
  try {
    // First, try to parse the code as-is
    let codeToParse = code.trim();
    
    // If the code doesn't start with < or doesn't look like JSX, return null
    if (!codeToParse.startsWith('<')) {
      return null;
    }
    
    let ast;
    try {
      ast = parser.parse(codeToParse, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });
    } catch (firstError) {
      // If parsing fails, try wrapping in a React Fragment
      try {
        const wrappedCode = `<>${codeToParse}</>`;
        ast = parser.parse(wrappedCode, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        });
      } catch (secondError) {
        console.error('Error parsing component:', firstError);
        return null;
      }
    }

    let componentElement: SerializedElement | null = null;

    traverse(ast, {
      JSXElement(path) {
        // Only take the first/root JSX element
        if (!componentElement) {
          componentElement = serializeJSXElement(path.node);
        }
      },
      JSXFragment(path) {
        // Only take the first fragment if no element found yet
        if (!componentElement) {
          componentElement = {
            type: 'Fragment',
            props: {},
            children: path.node.children.map(child => 
              t.isJSXElement(child) ? serializeJSXElement(child) :
              t.isJSXText(child) ? child.value.trim() :
              t.isJSXExpressionContainer(child) ? 'expression' : ''
            ).filter(Boolean),
            id: generateId()
          };
        }
      },
    });

    return componentElement;
  } catch (error) {
    console.error('Error parsing component:', error);
    return null;
  }
}

function serializeJSXElement(element: t.JSXElement): SerializedElement {
  const tagName = t.isJSXIdentifier(element.openingElement.name) 
    ? element.openingElement.name.name 
    : 'div';

  const props: Record<string, unknown> = {};
  
  element.openingElement.attributes.forEach(attr => {
    if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
      const key = attr.name.name;
      let value: unknown = '';
      
      if (attr.value) {
        if (t.isStringLiteral(attr.value)) {
          value = attr.value.value;
        } else if (t.isJSXExpressionContainer(attr.value)) {
          if (t.isStringLiteral(attr.value.expression)) {
            value = attr.value.expression.value;
          } else if (t.isNumericLiteral(attr.value.expression)) {
            value = attr.value.expression.value;
          } else if (t.isBooleanLiteral(attr.value.expression)) {
            value = attr.value.expression.value;
          } else {
            value = generate(attr.value.expression).code;
          }
        }
      } else {
        value = true; // Boolean attribute
      }
      
      props[key] = value;
    }
  });

  const children: (SerializedElement | string)[] = element.children.map(child => {
    if (t.isJSXElement(child)) {
      return serializeJSXElement(child);
    } else if (t.isJSXText(child)) {
      return child.value.trim();
    } else if (t.isJSXExpressionContainer(child)) {
      if (t.isStringLiteral(child.expression)) {
        return child.expression.value;
      }
      return 'expression';
    }
    return '';
  }).filter(child => child !== '');

  return {
    type: tagName,
    props,
    children,
    id: generateId()
  };
}

export function serializeToCode(element: SerializedElement): string {
  function createElement(el: SerializedElement | string, depth = 0): string {
    if (typeof el === 'string') {
      return el;
    }

    const indent = '  '.repeat(depth);
    const { type, props, children } = el;
    
    // Handle React Fragment
    if (type === 'Fragment') {
      if (children.length === 0) {
        return `${indent}<></>`;
      }
      
      const childrenString = children
        .map(child => createElement(child, depth))
        .join('\n');
        
      return `${indent}<>\n${childrenString}\n${indent}</>`;
    }
    
    const propsString = Object.entries(props)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        } else if (typeof value === 'boolean') {
          return value ? key : '';
        } else {
          return `${key}={${JSON.stringify(value)}}`;
        }
      })
      .filter(Boolean)
      .join(' ');

    const openTag = `<${type}${propsString ? ` ${propsString}` : ''}>`;
    
    if (children.length === 0) {
      return `${indent}<${type}${propsString ? ` ${propsString}` : ''} />`;
    }

    const childrenString = children
      .map(child => createElement(child, depth + 1))
      .join('\n');

    return `${indent}${openTag}\n${childrenString}\n${indent}</${type}>`;
  }

  return createElement(element);
}

export function updateElementInTree(
  tree: SerializedElement,
  targetId: string,
  updates: Partial<SerializedElement>
): SerializedElement {
  if (tree.id === targetId) {
    return { ...tree, ...updates };
  }

  const updatedChildren = tree.children.map(child => {
    if (typeof child === 'string') {
      return child;
    }
    return updateElementInTree(child, targetId, updates);
  });

  return { ...tree, children: updatedChildren };
}

export function findElementById(tree: SerializedElement, targetId: string): SerializedElement | null {
  if (tree.id === targetId) {
    return tree;
  }

  for (const child of tree.children) {
    if (typeof child !== 'string') {
      const found = findElementById(child, targetId);
      if (found) {
        return found;
      }
    }
  }

  return null;
}
