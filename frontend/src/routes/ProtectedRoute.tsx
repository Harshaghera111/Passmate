// ProtectedRoute.tsx — Role-based route guard component
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../services/authService';

const ROLE_HOME: Record<UserRole, string> = {
  student: '/student/dashboard',
  parent:  '/student/dashboard',
  warden:  '/warden/dashboard',
  guard:   '/guard/home',
  admin:   '/admin/dashboard',
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to own dashboard instead of showing unauthorized
    return <Navigate to={ROLE_HOME[user.role] ?? '/login'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
export { ROLE_HOME };
