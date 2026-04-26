import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import { useAuthStore } from '../store/authStore';

const AppShell: React.FC = () => {
  const { isAuthenticated, authLoading, user, initAuthListener } = useAuthStore();

  // Subscribe to Firebase auth state on mount — MUST run before any auth check
  useEffect(() => {
    const unsubscribe = initAuthListener();
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 1️⃣ While Firebase Auth is resolving, show a full-page loader — do NOT redirect yet
  if (authLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-bg-base z-50">
        <div className="flex flex-col items-center gap-4">
          {/* Animated logo mark */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-primary to-blue-400 opacity-20 animate-ping" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary to-blue-400 flex items-center justify-center shadow-lg">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                <path d="M16 14V22" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <circle cx="16" cy="11" r="2" fill="white" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-text-secondary animate-pulse">Verifying session…</p>
          </div>
        </div>
      </div>
    );
  }

  // 2️⃣ Auth resolved — not authenticated → redirect to login
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  // 3️⃣ Authenticated but profile not yet complete → redirect to profile form
  if (user.profileComplete === false) return <Navigate to="/complete-profile" replace />;

  // 4️⃣ Authenticated — render shell
  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-60 transition-all duration-300">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
};

export default AppShell;
