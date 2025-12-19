# DailyMate Coding Standards

This document outlines the coding standards and best practices for the DailyMate financial tracking app.

## Project Structure

```
/app              - Expo Router screens
/components       - Reusable UI components
/context          - React Context providers
/hooks            - Custom React hooks
/services         - Business logic and external services
/types            - TypeScript type definitions
/utils            - Pure utility functions
/constants        - App-wide constants and theme
```

## Code Reusability

### 1. Utility Functions (`/utils`)

All pure utility functions should be placed in the `/utils` directory:

- **`formatters.ts`**: Currency and date formatting
- **`account-helpers.ts`**: Account-related operations
- **`transaction-helpers.ts`**: Transaction-related operations
- **`constants.ts`**: Shared constants

**Example:**
```typescript
// ✅ Good - Reusable utility
import { formatCurrency } from '@/utils/formatters';
const displayAmount = formatCurrency(amount);

// ❌ Bad - Duplicated code
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};
```

### 2. Custom Hooks (`/hooks`)

Extract common patterns into custom hooks:

- **`use-formatting.ts`**: Formatting utilities
- **`use-accounts.ts`**: Account operations
- **`use-transactions.ts`**: Transaction operations

**Example:**
```typescript
// ✅ Good - Using custom hook
const { formatCurrency, formatDate } = useFormatting();
const { totalBalance, getAccountName } = useAccounts(accounts);

// ❌ Bad - Duplicated logic in component
const formatCurrency = (amount: number) => { /* ... */ };
const getAccountName = (id: string) => { /* ... */ };
```

### 3. Constants (`/constants`)

Extract magic values to constants:

- **`theme.ts`**: Colors, spacing, typography
- **`constants.ts`**: Account types, filters, defaults

**Example:**
```typescript
// ✅ Good - Using constants
import { ACCOUNT_TYPES, ACCOUNT_COLORS } from '@/utils/constants';

// ❌ Bad - Hardcoded values
const types = ['Cash', 'Savings Account', ...];
```

## Component Standards

### 1. Component Structure

```typescript
// 1. Imports (grouped by type)
import { React hooks } from 'react';
import { Third-party } from 'external';
import { Local components } from '@/components';
import { Utils } from '@/utils';
import { Types } from '@/types';

// 2. Component definition
export default function ComponentName() {
  // 3. Hooks
  const { data } = useApp();
  
  // 4. State
  const [state, setState] = useState();
  
  // 5. Computed values (useMemo)
  const computed = useMemo(() => {}, [deps]);
  
  // 6. Handlers (useCallback)
  const handleAction = useCallback(() => {}, [deps]);
  
  // 7. Render
  return <View>...</View>;
}
```

### 2. Props Interface

Always define TypeScript interfaces for component props:

```typescript
interface ComponentProps {
  title: string;
  onPress: () => void;
  optional?: boolean;
}

export function Component({ title, onPress, optional }: ComponentProps) {
  // ...
}
```

### 3. Styling

- Use StyleSheet.create for all styles
- Use theme constants (Spacing, Colors, BorderRadius)
- Avoid inline styles except for dynamic values

```typescript
// ✅ Good
const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
});

// ❌ Bad
<View style={{ padding: 16, borderRadius: 12 }} />
```

## Performance Best Practices

### 1. Memoization

Use `useMemo` for expensive computations:

```typescript
const filteredData = useMemo(() => {
  return data.filter(/* ... */).sort(/* ... */);
}, [data, filter]);
```

### 2. Callbacks

Use `useCallback` for functions passed as props:

```typescript
const handlePress = useCallback(() => {
  // ...
}, [dependencies]);
```

### 3. Component Memoization

Memoize components that receive stable props:

```typescript
export const MemoizedComponent = React.memo(Component);
```

## Type Safety

### 1. Type Definitions

All types should be defined in `/types`:

```typescript
// types/index.ts
export interface Account {
  id: string;
  name: string;
  // ...
}
```

### 2. Avoid `any`

Always use proper types:

```typescript
// ✅ Good
const handleChange = (value: string) => { /* ... */ };

// ❌ Bad
const handleChange = (value: any) => { /* ... */ };
```

## Error Handling

### 1. Try-Catch Blocks

Always handle errors gracefully:

```typescript
try {
  await someAsyncOperation();
} catch (error) {
  console.error('Operation failed:', error);
  // Show user-friendly message
}
```

### 2. Null Checks

Always check for null/undefined:

```typescript
const account = accounts.find(a => a.id === id);
if (!account) {
  return 'Unknown';
}
```

## Naming Conventions

### 1. Files
- Components: `kebab-case.tsx` (e.g., `account-card.tsx`)
- Utilities: `kebab-case.ts` (e.g., `formatters.ts`)
- Hooks: `use-kebab-case.ts` (e.g., `use-accounts.ts`)

### 2. Variables & Functions
- camelCase for variables and functions
- PascalCase for components and types
- UPPER_SNAKE_CASE for constants

### 3. Components
- PascalCase for component names
- Descriptive, not abbreviated

```typescript
// ✅ Good
function AccountCard() { }
const formatCurrency = () => { };
const ACCOUNT_TYPES = [];

// ❌ Bad
function AccCard() { }
const fmtCurr = () => { };
const accTypes = [];
```

## Import Organization

Group imports in this order:

1. React and React Native
2. Third-party libraries
3. Local components
4. Local utilities/hooks
5. Types
6. Constants

```typescript
import { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';

import { useFormatting } from '@/hooks/use-formatting';
import { formatCurrency } from '@/utils/formatters';

import { Account } from '@/types';
import { Colors, Spacing } from '@/constants/theme';
```

## Testing Considerations

### 1. Pure Functions

Keep utility functions pure (no side effects):

```typescript
// ✅ Good - Pure function
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

// ❌ Bad - Side effects
export function formatCurrency(amount: number): string {
  console.log(amount); // Side effect
  return /* ... */;
}
```

### 2. Testable Components

Structure components for easy testing:

- Extract business logic to utilities
- Use dependency injection where possible
- Keep components focused on presentation

## Documentation

### 1. Function Documentation

Document complex functions:

```typescript
/**
 * Format a number as Indian Rupee currency
 * @param amount - The amount to format
 * @param options - Optional formatting options
 * @returns Formatted currency string (e.g., "₹1,23,456")
 */
export function formatCurrency(amount: number, options?: {...}): string {
  // ...
}
```

### 2. Component Documentation

Document component props and usage:

```typescript
/**
 * Button component with multiple variants
 * @param title - Button text
 * @param onPress - Press handler
 * @param variant - Visual style variant
 */
export function Button({ title, onPress, variant }: ButtonProps) {
  // ...
}
```

## Code Review Checklist

- [ ] No duplicated code
- [ ] All utilities are in `/utils`
- [ ] Custom hooks used for common patterns
- [ ] Constants extracted to `/constants`
- [ ] Proper TypeScript types
- [ ] Error handling implemented
- [ ] Performance optimizations (useMemo, useCallback)
- [ ] Consistent naming conventions
- [ ] Proper import organization
- [ ] No console.logs in production code
- [ ] All linting errors resolved
