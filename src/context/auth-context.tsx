import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type UserRole = 'employee' | 'manager';

type ManagerLoginResult = {
  success: boolean;
  error?: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  role: UserRole | null;
  loginAsEmployee: () => void;
  loginAsManager: (email: string, password: string) => ManagerLoginResult;
  logout: () => void;
};

const MANAGER_EMAIL = 'zeytinkuruyemisMudur@gmail.com';
const MANAGER_PASSWORD = 'Zeytin2026.@Culha';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: role !== null,
      role,
      loginAsEmployee: () => {
        setRole('employee');
      },
      loginAsManager: (email, password) => {
        if (
          email.trim().toLowerCase() !== MANAGER_EMAIL.toLowerCase() ||
          password !== MANAGER_PASSWORD
        ) {
          return {
            success: false,
            error: 'Mail veya sifre hatali.',
          };
        }

        setRole('manager');

        return { success: true };
      },
      logout: () => {
        setRole(null);
      },
    }),
    [role],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
