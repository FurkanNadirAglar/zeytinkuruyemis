import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { ColorValue, Platform, StyleSheet, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

type TabSymbolName = ComponentProps<typeof SymbolView>['name'];

type TabDefinition = {
  routeName: string;
  title: string;
  icon: TabSymbolName;
};

const MANAGER_ACTIVE_TINT = '#D9911A';
const MANAGER_INACTIVE_TINT = '#222222';
const EMPLOYEE_ACTIVE_TINT = '#D9A028';
const EMPLOYEE_INACTIVE_TINT = '#F4E8D0';

const managerTabs: TabDefinition[] = [
  {
    routeName: 'manager-home',
    title: 'Dashboard',
    icon: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  {
    routeName: 'reportlar',
    title: 'Raporlar',
    icon: { ios: 'book.closed.fill', android: 'menu_book', web: 'menu_book' },
  },
  {
    routeName: 'urunler',
    title: 'Urunler',
    icon: { ios: 'shippingbox.fill', android: 'inventory_2', web: 'inventory_2' },
  },
  {
    routeName: 'subeler',
    title: 'Subeler',
    icon: { ios: 'building.2.fill', android: 'storefront', web: 'storefront' },
  },
  {
    routeName: 'ayarlar',
    title: 'Ayarlar',
    icon: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  },
];

const employeeTabs: TabDefinition[] = [
  {
    routeName: 'employee-home',
    title: 'Ana Sayfa',
    icon: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  {
    routeName: 'sayim',
    title: 'Sayim',
    icon: { ios: 'barcode.viewfinder', android: 'qr_code_scanner', web: 'qr_code_scanner' },
  },
  {
    routeName: 'profil',
    title: 'Profil',
    icon: { ios: 'person', android: 'person', web: 'person' },
  },
];

function createTabBarIcon(iconName: TabSymbolName) {
  function TabBarIcon({ color, size }: { color: ColorValue; size: number }) {
    return <SymbolView name={iconName} tintColor={color} size={size} />;
  }

  return TabBarIcon;
}

export default function AppTabsContent() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { role } = useAuth();
  const isManager = role === 'manager';
  const tabs = role === 'manager' ? managerTabs : employeeTabs;
  const hiddenScreens = isManager
    ? ['index', 'explore', 'employee-home', 'sayim', 'profil']
    : ['index', 'explore', 'manager-home', 'reportlar', 'urunler', 'subeler', 'ayarlar'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isManager ? MANAGER_ACTIVE_TINT : EMPLOYEE_ACTIVE_TINT,
        tabBarInactiveTintColor: isManager ? MANAGER_INACTIVE_TINT : EMPLOYEE_INACTIVE_TINT,
        tabBarShowLabel: true,
        tabBarLabelStyle: [styles.tabBarLabel, !isManager && styles.employeeTabBarLabel],
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: [
          styles.tabBar,
          !isManager && styles.employeeTabBar,
          {
            backgroundColor: isManager ? colors.background : '#2F1D0E',
            borderColor: isManager ? 'rgba(34, 34, 34, 0.08)' : 'rgba(217, 160, 40, 0.18)',
          },
        ],
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.routeName}
          name={tab.routeName}
          options={{
            title: tab.title,
            tabBarIcon: createTabBarIcon(tab.icon),
          }}
        />
      ))}

      {hiddenScreens.map((screenName) => (
        <Tabs.Screen key={screenName} name={screenName} options={{ href: null }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: Platform.select({ ios: 18, android: 12, default: 12 }),
    height: 82,
    borderRadius: 28,
    borderTopWidth: 0,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 8,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  tabBarItem: {
    paddingTop: 4,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: 600,
    marginTop: 2,
  },
  employeeTabBar: {
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 26,
    height: 88,
    paddingBottom: 14,
    shadowOpacity: 0,
  },
  employeeTabBarLabel: {
    fontWeight: 700,
  },
});
