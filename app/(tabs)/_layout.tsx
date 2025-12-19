import { Tabs } from 'expo-router';

import { TabBarWithFAB } from '@/components/tab-bar-with-fab';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBarWithFAB {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Stats',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Budget',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
