# Component Documentation Guide

This guide establishes standards for documenting components in the Valorwell First EHR application. Consistent documentation helps new developers understand component purpose and usage, improving maintainability and development speed.

## Documentation Standard

All components should be documented using JSDoc comments with the following structure:

```tsx
/**
 * @component ComponentName
 * @description A brief description of what the component does and its purpose.
 *
 * @example
 * // Basic usage example
 * <ComponentName prop1="value" prop2={value} />
 *
 * // Complex usage example (if applicable)
 * <ComponentName
 *   prop1="value"
 *   prop2={value}
 *   onEvent={() => handleEvent()}
 * />
 */
export interface ComponentNameProps {
  /**
   * Description of what this prop does
   * @default defaultValue (if applicable)
   */
  propName: PropType;
  
  /**
   * Description of what this prop does
   * @default defaultValue (if applicable)
   */
  anotherProp?: OptionalPropType;
}

export function ComponentName({ propName, anotherProp = defaultValue }: ComponentNameProps) {
  // Component implementation
}
```

## Documentation Sections

### Component JSDoc

The main component JSDoc should include:

1. **@component** - The name of the component
2. **@description** - A clear, concise description of the component's purpose and functionality
3. **@example** - At least one usage example, more for complex components
4. **@see** (optional) - References to related components or documentation

### Props Documentation

Each prop in the interface should be documented with:

1. A description of what the prop does and how it affects the component
2. **@default** - The default value (if applicable)
3. **@required** - Indicate if the prop is required (optional, as TypeScript already shows this)
4. **@type** - Clarification of complex types (optional, as TypeScript already shows this)

## Best Practices

1. **Be Concise**: Keep descriptions clear and to the point
2. **Include Examples**: Always provide usage examples
3. **Document Edge Cases**: Mention any limitations or special considerations
4. **Keep Updated**: Update documentation when component functionality changes
5. **Document Side Effects**: Note any side effects or interactions with other components
6. **Accessibility**: Include accessibility considerations where applicable

## Example: Well-Documented Component

Here's an example of a well-documented component:

```tsx
/**
 * @component Button
 * @description A customizable button component with various styles and states.
 * Supports different variants, sizes, and can contain icons.
 *
 * @example
 * // Basic button
 * <Button>Click me</Button>
 *
 * // Primary button with icon
 * <Button variant="primary" icon={<PlusIcon />}>Add Item</Button>
 *
 * @see ButtonGroup - For grouping multiple buttons together
 */
export interface ButtonProps {
  /**
   * The content to display inside the button
   */
  children: React.ReactNode;
  
  /**
   * The visual style variant of the button
   * @default "default"
   */
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "link" | "destructive";
  
  /**
   * The size of the button
   * @default "default"
   */
  size?: "default" | "sm" | "lg" | "icon";
  
  /**
   * Icon to display alongside the button text
   */
  icon?: React.ReactNode;
  
  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Function called when the button is clicked
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
}

export function Button({
  children,
  variant = "default",
  size = "default",
  icon,
  disabled = false,
  onClick,
  className,
}: ButtonProps) {
  // Component implementation
}
```

## Documentation for Hooks and Utilities

Hooks and utility functions should follow a similar documentation pattern:

```tsx
/**
 * @hook useComponentName
 * @description Description of what the hook does and when to use it.
 *
 * @param {ParamType} paramName - Description of the parameter
 * @returns {ReturnType} Description of the return value
 *
 * @example
 * // Example usage
 * const result = useComponentName(param);
 */
```

## Implementation Guide

When implementing documentation for existing components:

1. Start with the most frequently used components
2. Focus on complex components that would benefit most from documentation
3. Document props thoroughly, especially those with non-obvious purposes
4. Include real-world usage examples from the application
5. Document any known issues or limitations

## Automated Documentation Tools

Consider using tools to help maintain documentation:

- ESLint plugins for enforcing JSDoc comments
- Documentation generators for creating component libraries
- Storybook for interactive component documentation

By following these guidelines, we can create a more maintainable and developer-friendly codebase.