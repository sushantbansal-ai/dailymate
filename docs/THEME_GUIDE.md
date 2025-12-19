# DailyMate SaaS Design System

## Overview
Professional, minimal design system for financial tracking with a sophisticated neutral color palette.

## Color Palette

### Light Theme
```
Primary Brand: #394541 (Dark Slate)
Background:    #fcfcfc (Pure White)
Secondary BG:  #fef2ec (Warm Cream)
Tertiary BG:   #fedee0 (Soft Pink)
Borders:       #dbdddd (Light Grey)
Text Primary:  #394541 (Dark Slate)
Text Secondary: #abb0ac (Medium Grey)
Text Tertiary: #dbdddd (Light Grey)
```

### Semantic Colors
```
Success: #52b788 (Soft Green)
Error:   #e76f51 (Soft Coral)
Warning: #f4a261 (Warm Amber)
Info:    #457b9d (Soft Blue)
```

## Typography

### Scale
- **Display Large**: 48px, Bold (Hero sections)
- **Display Medium**: 36px, Bold
- **H1**: 32px, Bold (Page titles)
- **H2**: 24px, Semibold (Section headers)
- **H3**: 20px, Semibold
- **H4**: 18px, Semibold
- **Body Large**: 16px, Regular
- **Body Medium**: 14px, Regular
- **Body Small**: 12px, Regular
- **Label Large**: 14px, Semibold (Form labels)
- **Label Medium**: 12px, Medium
- **Label Small**: 10px, Medium

### Usage
```typescript
import { Typography } from '@/constants/theme';

<Text style={[Typography.h2, { color: colors.text }]}>
  Section Title
</Text>
```

## Spacing System
Based on 4px grid for precise control:

```typescript
xxs:  2px   // Micro spacing
xs:   4px   // Extra small
sm:   8px   // Small (minimum touch target spacing)
md:   12px  // Medium
lg:   16px  // Large (standard)
xl:   24px  // Extra large
xxl:  32px  // 2X large
xxxl: 48px  // 3X large (major sections)
```

## Border Radius
```typescript
none: 0px
xs:   4px
sm:   6px
md:   8px   // Standard for inputs/buttons
lg:   12px  // Cards
xl:   16px
xxl:  24px
full: 9999px // Pills/circles
```

## Shadows
Professional, subtle depth:

```typescript
none: No shadow
xs:   Minimal (hover states)
sm:   Subtle (cards)
md:   Standard (elevated cards)
lg:   Prominent (modals)
xl:   Maximum (overlays)
```

## Component Sizes

### Touch Targets
- Minimum: 44px × 44px (Apple HIG / Material Design)

### Buttons
- Small: 36px height
- Medium: 44px height
- Large: 52px height

### Input Fields
- Small: 36px height
- Medium: 44px height
- Large: 52px height

### Icons
- Small: 16px
- Medium: 20px
- Large: 24px
- XLarge: 32px

## Component Variants

### Button
```typescript
<Button
  title="Save"
  variant="primary"      // primary | secondary | outline | ghost | destructive
  size="medium"          // small | medium | large
  disabled={false}
  loading={false}
  icon={<Icon />}
  iconPosition="left"    // left | right
  fullWidth={false}
/>
```

### Input
```typescript
<Input
  label="Email"
  placeholder="Enter email"
  error="Required field"
  helperText="We'll never share your email"
  leftIcon={<Icon />}
  rightIcon={<Icon />}
  size="medium"          // small | medium | large
/>
```

### Card
```typescript
<Card
  variant="default"      // default | elevated | outlined | flat
  padding="lg"           // none | sm | md | lg
  onPress={() => {}}     // Optional
>
  <Text>Content</Text>
</Card>
```

### Select
```typescript
<Select
  label="Country"
  value={value}
  options={[
    { label: 'USA', value: 'us' },
    { label: 'UK', value: 'uk' }
  ]}
  onValueChange={setValue}
  placeholder="Select country"
  error="Required"
  helperText="Choose your country"
  size="medium"
/>
```

### DatePicker
```typescript
<DatePicker
  label="Start Date"
  value="2024-01-01"
  onChange={setDate}
  placeholder="Select date"
  error="Required"
  helperText="When do you want to start?"
  minimumDate={new Date()}
  maximumDate={new Date(2025, 11, 31)}
  size="medium"
/>
```

## Best Practices

### 1. Consistency
- Always use theme constants instead of hardcoded values
- Use Typography for all text styling
- Use Spacing for all margins/padding
- Use Colors from the theme

### 2. Touch Targets
- Minimum 44×44px for all tappable elements
- Add adequate spacing between interactive elements (min 8px)
- Use haptic feedback for interactions

### 3. Visual Hierarchy
- Use typography scale to establish importance
- Leverage color contrast (text vs textSecondary vs textTertiary)
- Apply shadows subtly for depth

### 4. Performance
- Use memo for complex components
- Lazy load heavy dependencies
- Optimize images and assets

### 5. Accessibility
- Maintain WCAG contrast ratios (4.5:1 for normal text)
- Label all interactive elements
- Support screen readers
- Ensure keyboard navigation

## Screen Headers
All screens now show proper titles instead of route names:

```
/accounts/add → "Add Account"
/accounts/edit → "Edit Account"
/accounts/index → "Your Accounts"
/transactions/add → "Add Transaction"
/categories/add → "Add Category"
/categories/index → "Transaction Categories"
```

## Theme Usage Example

```typescript
import { 
  Colors, 
  Typography, 
  Spacing, 
  BorderRadius, 
  Shadows,
  ComponentSizes 
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function MyComponent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={{
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.sm,
    }}>
      <Text style={[
        Typography.h3,
        { color: colors.text }
      ]}>
        Professional Title
      </Text>
      <Text style={[
        Typography.bodyMedium,
        { color: colors.textSecondary, marginTop: Spacing.sm }
      ]}>
        Clean, readable body text with proper hierarchy.
      </Text>
    </View>
  );
}
```

## Migration Checklist

When updating existing components:

- [ ] Replace hardcoded colors with theme Colors
- [ ] Replace font sizes with Typography constants
- [ ] Replace spacing values with Spacing constants
- [ ] Replace border radius with BorderRadius constants
- [ ] Add proper shadows using Shadows constants
- [ ] Ensure minimum touch target sizes (44px)
- [ ] Add haptic feedback to interactions
- [ ] Use proper component variants
- [ ] Add error states and helper text
- [ ] Test in both light and dark modes

## Resources

- Figma Design File: [Link when available]
- Component Storybook: [Link when available]
- Color Contrast Checker: https://webaim.org/resources/contrastchecker/
- Typography Scale Calculator: https://type-scale.com/

---

**Version:** 2.0.0  
**Last Updated:** [Current Date]  
**Maintained by:** DailyMate Design Team
