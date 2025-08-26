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
    
    // Check if this is a function component
    const isFunctionComponent = codeToParse.includes('export const') || 
                               codeToParse.includes('const') ||
                               codeToParse.includes('function ') ||
                               codeToParse.includes('export function');
    
    let ast;
    
    if (isFunctionComponent) {
      // Parse as a module with function component
      ast = parser.parse(codeToParse, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });
    } else if (codeToParse.startsWith('<')) {
      // Parse as JSX directly
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
    } else {
      // If the code doesn't start with < and isn't a function component, return null
      return null;
    }

    let componentElement: SerializedElement | null = null;

    traverse(ast, {
      // Handle function components
      ArrowFunctionExpression(path) {
        if (componentElement) return; // Only take the first component
        
        // Check if this arrow function returns JSX
        if (t.isBlockStatement(path.node.body)) {
          // Look for return statement with JSX
          const returnStatement = path.node.body.body.find(stmt => t.isReturnStatement(stmt));
          if (returnStatement && t.isReturnStatement(returnStatement) && returnStatement.argument) {
            if (t.isJSXElement(returnStatement.argument)) {
              componentElement = serializeJSXElement(returnStatement.argument);
            } else if (t.isJSXFragment(returnStatement.argument)) {
              componentElement = {
                type: 'Fragment',
                props: {},
                children: returnStatement.argument.children.map(child => 
                  t.isJSXElement(child) ? serializeJSXElement(child) :
                  t.isJSXText(child) ? child.value.trim() :
                  t.isJSXExpressionContainer(child) ? 'expression' : ''
                ).filter(Boolean),
                id: generateId()
              };
            }
          }
        } else if (t.isJSXElement(path.node.body)) {
          // Direct JSX return
          componentElement = serializeJSXElement(path.node.body);
        } else if (t.isJSXFragment(path.node.body)) {
          // Direct JSX Fragment return
          componentElement = {
            type: 'Fragment',
            props: {},
            children: path.node.body.children.map(child => 
              t.isJSXElement(child) ? serializeJSXElement(child) :
              t.isJSXText(child) ? child.value.trim() :
              t.isJSXExpressionContainer(child) ? 'expression' : ''
            ).filter(Boolean),
            id: generateId()
          };
        }
      },
      
      // Handle function declarations
      FunctionDeclaration(path) {
        if (componentElement) return; // Only take the first component
        
        // Look for return statement with JSX
        const returnStatement = path.node.body.body.find(stmt => t.isReturnStatement(stmt));
        if (returnStatement && t.isReturnStatement(returnStatement) && returnStatement.argument) {
          if (t.isJSXElement(returnStatement.argument)) {
            componentElement = serializeJSXElement(returnStatement.argument);
          } else if (t.isJSXFragment(returnStatement.argument)) {
            componentElement = {
              type: 'Fragment',
              props: {},
              children: returnStatement.argument.children.map(child => 
                t.isJSXElement(child) ? serializeJSXElement(child) :
                t.isJSXText(child) ? child.value.trim() :
                t.isJSXExpressionContainer(child) ? 'expression' : ''
              ).filter(Boolean),
              id: generateId()
            };
          }
        }
      },
      
      JSXElement(path) {
        // Only take the first/root JSX element if no function component found
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
          } else if (t.isObjectExpression(attr.value.expression)) {
            // Handle style objects and other object expressions
            const obj: Record<string, unknown> = {};
            attr.value.expression.properties.forEach(prop => {
              if (t.isObjectProperty(prop) && 
                  (t.isStringLiteral(prop.key) || t.isIdentifier(prop.key))) {
                const propKey = t.isStringLiteral(prop.key) ? prop.key.value : prop.key.name;
                
                if (t.isStringLiteral(prop.value)) {
                  obj[propKey] = prop.value.value;
                } else if (t.isNumericLiteral(prop.value)) {
                  obj[propKey] = prop.value.value;
                } else if (t.isBooleanLiteral(prop.value)) {
                  obj[propKey] = prop.value.value;
                } else {
                  obj[propKey] = generate(prop.value).code;
                }
              }
            });
            value = obj;
          } else {
            // For other expressions, generate the code
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
      const trimmedText = child.value.trim();
      return trimmedText || '';
    } else if (t.isJSXExpressionContainer(child)) {
      if (t.isStringLiteral(child.expression)) {
        return child.expression.value;
      } else if (t.isNumericLiteral(child.expression)) {
        return child.expression.value.toString();
      } else if (t.isBooleanLiteral(child.expression)) {
        return child.expression.value.toString();
      }
      // For other expressions, try to generate readable code
      return generate(child.expression).code;
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
        } else if (typeof value === 'number') {
          return `${key}={${value}}`;
        } else if (typeof value === 'object' && value !== null) {
          // Handle object props like style
          const objString = JSON.stringify(value, null, 0)
            .replace(/"/g, "'")  // Use single quotes for object keys/values
            .replace(/'/g, '"'); // But keep double quotes for JSON
          return `${key}={${objString}}`;
        } else {
          // Handle expressions or other complex values
          return `${key}={${String(value)}}`;
        }
      })
      .filter(Boolean)
      .join(' ');

    const openTag = `<${type}${propsString ? ` ${propsString}` : ''}>`;
    
    if (children.length === 0) {
      return `${indent}<${type}${propsString ? ` ${propsString}` : ''} />`;
    }

    // Check if all children are simple text (no nested elements)
    const isSimpleText = children.length === 1 && typeof children[0] === 'string';
    
    if (isSimpleText) {
      return `${indent}${openTag}${children[0]}</${type}>`;
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
