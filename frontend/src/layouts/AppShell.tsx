import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import { useAuthStore } from '../store/authStore';

const AppShell: React.FC = () => {
  const { isAuthenticated, user, initAuthListener } = useAuthStore();

  // Subscribe to Firebase auth state on mount
  useEffect(() => {
    const unsubscribe = initAuthListener();
    return unsubscribe;
  }, [initAuthListener]);

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

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
