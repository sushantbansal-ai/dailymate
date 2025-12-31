import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from '@/context/AppContext';
import { AppLockWrapper } from '@/components/security/app-lock-wrapper';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Suppress non-critical expo-keep-awake errors
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args: any[]) => {
      const errorMessage = args[0]?.toString() || '';
      // Suppress keep-awake errors as they're non-critical
      if (errorMessage.includes('Unable to activate keep awake') || 
          errorMessage.includes('keep awake') ||
          (args[0]?.message && args[0].message.includes('keep awake'))) {
        return;
      }
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const warnMessage = args[0]?.toString() || '';
      // Suppress keep-awake warnings as they're non-critical
      if (warnMessage.includes('keep awake')) {
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppLockWrapper>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
              }}>
            {/* Tab navigator */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            
            {/* Account screens */}
            <Stack.Screen
              name="accounts/add"
              options={{
                headerShown: false,
                title: 'Add Account',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="accounts/edit"
              options={{
                headerShown: false,
                title: 'Edit Account',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="accounts/index"
              options={{
                headerShown: false,
                title: 'Your Accounts',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="accounts/select"
              options={{
                headerShown: false,
                title: 'Select Account',
                presentation: 'card',
              }}
            />
            
            
            {/* Category screens */}
            <Stack.Screen
              name="categories/add"
              options={{
                headerShown: false,
                title: 'Add Category',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="categories/index"
              options={{
                headerShown: false,
                title: 'Transaction Categories',
                presentation: 'card',
              }}
            />
            
            {/* Label screens */}
            <Stack.Screen
              name="labels/add"
              options={{
                headerShown: false,
                title: 'Add Label',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="labels/index"
              options={{
                headerShown: false,
                title: 'Labels',
                presentation: 'card',
              }}
            />
            
            {/* Contact screens */}
            <Stack.Screen
              name="contacts/add"
              options={{
                headerShown: false,
                title: 'Add Contact',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="contacts/index"
              options={{
                headerShown: false,
                title: 'Contacts',
                presentation: 'card',
              }}
            />
            
            {/* Budget screens */}
            <Stack.Screen
              name="budgets/add"
              options={{
                headerShown: false,
                title: 'Add Budget',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="budgets/index"
              options={{
                headerShown: false,
                title: 'Budgets',
                presentation: 'card',
              }}
            />
            
            {/* Goal screens */}
            <Stack.Screen
              name="goals/add"
              options={{
                headerShown: false,
                title: 'Add Goal',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="goals/index"
              options={{
                headerShown: false,
                title: 'Goals',
                presentation: 'card',
              }}
            />
            
            {/* Planned Transaction screens */}
            <Stack.Screen
              name="planned-transactions/add"
              options={{
                headerShown: false,
                title: 'Add Planned Transaction',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="planned-transactions/index"
              options={{
                headerShown: false,
                title: 'Planned Transactions',
                presentation: 'card',
              }}
            />
            
            {/* Bill screens */}
            <Stack.Screen
              name="bills/add"
              options={{
                headerShown: false,
                title: 'Add Bill',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="bills/index"
              options={{
                headerShown: false,
                title: 'Bills & Reminders',
                presentation: 'card',
              }}
            />
            
            {/* Reports screens */}
            <Stack.Screen
              name="reports/index"
              options={{
                headerShown: false,
                title: 'Reports & Analytics',
                presentation: 'card',
              }}
            />
            
            {/* Statistics screens */}
            <Stack.Screen
              name="statistics/index"
              options={{
                headerShown: false,
                title: 'Statistics Dashboard',
                presentation: 'card',
              }}
            />
            
            {/* Security screens */}
            <Stack.Screen
              name="security/index"
              options={{
                headerShown: false,
                title: 'Security Settings',
                presentation: 'card',
              }}
            />
            
            {/* Sync screens */}
            <Stack.Screen
              name="sync/index"
              options={{
                headerShown: false,
                title: 'Google Sheets Sync',
                presentation: 'card',
              }}
            />
            
            {/* Modal */}
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                title: 'Modal',
              }}
            />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
        </AppLockWrapper>
      </AppProvider>
    </SafeAreaProvider>
  );
}
