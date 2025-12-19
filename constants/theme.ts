/**
 * DailyMate Design System
 * Professional SaaS-style design system for financial tracking
 * 
 * Color Palette:
 * - #fcfcfc: Pure white/lightest background
 * - #fef2ec: Warm cream (subtle accents)
 * - #fedee0: Soft pink (highlights)
 * - #dbdddd: Light grey (borders/dividers)
 * - #abb0ac: Medium grey (secondary text)
 * - #394541: Dark slate (primary text/brand)
 */

import { Platform } from 'react-native';

// Primary brand colors - Vibrant modern palette
const primaryLight = '#2563EB'; // Vibrant blue - main brand color
const primaryDark = '#60A5FA'; // Light blue for dark mode
const accentLight = '#F0F9FF'; // Light blue accent
const accentWarm = '#FEF3C7'; // Warm yellow accent
const tintColorLight = primaryLight;
const tintColorDark = primaryDark;

export const Colors = {
  light: {
    // Text colors - Professional hierarchy
    text: '#1E293B',           // Dark slate - primary text
    textSecondary: '#64748B',  // Medium slate - secondary text
    textTertiary: '#CBD5E1',   // Light slate - tertiary text/placeholders
    
    // Background colors - Clean and vibrant
    background: '#FFFFFF',          // Pure white - main background
    backgroundSecondary: '#F0F9FF', // Light blue - secondary sections
    backgroundTertiary: '#FEF3C7',  // Warm yellow - subtle highlights
    
    // Brand colors
    tint: tintColorLight,
    primary: primaryLight,        // #2563EB - Vibrant blue
    primaryLight: '#3B82F6',      // Lighter blue
    primaryDark: '#1D4ED8',       // Darker blue
    
    // Accent colors
    accent: accentLight,          // #F0F9FF - Light blue
    accentWarm: accentWarm,       // #FEF3C7 - Warm yellow
    
    // Semantic colors - Vibrant and professional
    success: '#10B981',    // Vibrant green
    error: '#EF4444',      // Vibrant red
    warning: '#F59E0B',    // Vibrant amber
    info: '#3B82F6',       // Vibrant blue
    
    // UI colors - Clean and visible
    border: '#E2E8F0',           // Light slate borders
    borderLight: '#F1F5F9',      // Even lighter borders
    borderDark: '#64748B',       // Darker borders for emphasis
    icon: '#475569',             // Medium slate icons
    iconActive: '#2563EB',       // Primary blue for active icons
    tabIconDefault: '#94A3B8',   // Medium grey inactive tabs
    tabIconSelected: tintColorLight,
    
    // Card colors - Clean cards with subtle shadows
    cardBackground: '#FFFFFF',
    cardBorder: '#E2E8F0',
    cardShadow: 'rgba(37, 99, 235, 0.08)',
    
    // Income/Expense colors - Vibrant
    income: '#10B981',     // Vibrant green
    expense: '#EF4444',    // Vibrant red
    transfer: '#3B82F6',   // Vibrant blue
  },
  dark: {
    // Text colors
    text: '#F1F5F9',           // Almost white
    textSecondary: '#CBD5E1',  // Light slate
    textTertiary: '#94A3B8',   // Medium slate
    
    // Background colors
    background: '#0F172A',          // Very dark slate
    backgroundSecondary: '#1E293B', // Dark slate
    backgroundTertiary: '#334155',  // Medium slate
    
    // Brand colors
    tint: tintColorDark,
    primary: primaryDark,       // #60A5FA - Light blue
    primaryLight: '#93C5FD',    // Lighter blue
    primaryDark: '#3B82F6',     // Darker blue
    
    // Accent colors
    accent: '#1E3A8A',          // Dark blue accent
    accentWarm: '#78350F',      // Dark amber accent
    
    // Semantic colors
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',
    
    // UI colors
    border: '#334155',
    borderLight: '#1E293B',
    borderDark: '#64748B',
    icon: '#94A3B8',
    iconActive: '#60A5FA',      // Primary blue for active icons
    tabIconDefault: '#475569',
    tabIconSelected: tintColorDark,
    
    // Card colors
    cardBackground: '#1E293B',
    cardBorder: '#334155',
    cardShadow: 'rgba(0, 0, 0, 0.4)',
    
    // Income/Expense colors
    income: '#34D399',
    expense: '#F87171',
    transfer: '#60A5FA',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Typography system - Professional SaaS standards
export const Typography = {
  // Display - Hero sections
  displayLarge: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700' as const,
    letterSpacing: -1,
  },
  displayMedium: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  
  // Headings
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  h4: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  
  // Body text
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  
  // Labels
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  labelSmall: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  
  // Buttons
  buttonLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  buttonMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  buttonSmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
};

// Spacing system (4px base unit) - SaaS standard
// Mobile UX: Based on 4px grid system for precise control
export const Spacing = {
  xxs: 2,   // Micro spacing
  xs: 4,    // Extra small
  sm: 8,    // Small - minimum touch target spacing
  md: 12,   // Medium
  lg: 16,   // Large - standard spacing
  xl: 24,   // Extra large
  xxl: 32,  // 2X large
  xxxl: 48, // 3X large - major sections
};

// Border radius system - Modern, subtle curves
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Shadow system - Subtle, professional depth
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#394541',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#394541',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#394541',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#394541',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#394541',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Animation durations - Smooth, professional timing
export const Animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
};

// Component sizes - Consistent sizing system
export const ComponentSizes = {
  // Touch targets
  minTouchTarget: 44,
  
  // Buttons
  buttonHeightSmall: 36,
  buttonHeightMedium: 44,
  buttonHeightLarge: 52,
  
  // Input fields
  inputHeightSmall: 36,
  inputHeightMedium: 44,
  inputHeightLarge: 52,
  
  // Icons
  iconSmall: 16,
  iconMedium: 20,
  iconLarge: 24,
  iconXLarge: 32,
};

// Layout constants
export const Layout = {
  maxContentWidth: 1200,
  containerPadding: Spacing.lg,
  sectionSpacing: Spacing.xxxl,
};
