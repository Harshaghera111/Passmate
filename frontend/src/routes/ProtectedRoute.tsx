// ProtectedRoute.tsx — Role-based route guard with auth-loading awareness
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../services/authService';
import { Loader } from 'lucide-react';

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
  const { isAuthenticated, authLoading, user } = useAuthStore();

  // Wait for Firebase Auth to resolve before making any routing decision
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <Loader className="animate-spin text-accent-primary" size={28} />
      </div>
    );
  }

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to own dashboard instead of showing unauthorized
    return <Navigate to={ROLE_HOME[user.role] ?? '/login'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
export { ROLE_HOME };
