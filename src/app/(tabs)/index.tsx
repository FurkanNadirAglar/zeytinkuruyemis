import { Redirect } from 'expo-router';

import { useAuth } from '@/context/auth-context';

export default function HomeScreen() {
  const { role } = useAuth();

  return <Redirect href={role === 'manager' ? '/manager-home' : '/employee-home'} />;
}
