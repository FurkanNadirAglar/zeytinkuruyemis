import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/auth-context';

export default function AuthLayout() {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated) {
    return <Redirect href={role === 'manager' ? '/manager-home' : '/employee-home'} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
