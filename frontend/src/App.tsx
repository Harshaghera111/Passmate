import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppShell from './layouts/AppShell';
import ProtectedRoute from './routes/ProtectedRoute';

// Public pages
import LoginPage from './pages/LoginPage';
import ParentApprovalPage from './pages/parent/ParentApprovalPage';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import NewRequestPage from './pages/student/NewRequestPage';
import HistoryPage from './pages/student/HistoryPage';
import PassViewPage from './pages/student/PassViewPage';

// Warden
import WardenDashboard from './pages/warden/WardenDashboard';
import WardenRequestsPage from './pages/warden/WardenRequestsPage';
import WardenStudentsPage from './pages/warden/WardenStudentsPage';
import WardenEmergencyPage from './pages/warden/WardenEmergencyPage';

// Guard
import GuardHome from './pages/guard/GuardHome';
import GuardScannerPage from './pages/guard/GuardScannerPage';
import GuardVerifyPage from './pages/guard/GuardVerifyPage';
import GuardInvalidPassPage from './pages/guard/GuardInvalidPassPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminLogsPage from './pages/admin/AdminLogsPage';
import AdminViolationsPage from './pages/admin/AdminViolationsPage';

const App: React.FC = () => {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>

        {/* ── Public routes ── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/:role" element={<LoginPage />} />

        {/* Parent magic-link approval (no auth required) */}
        <Route path="/parent/approve/:id" element={<ParentApprovalPage />} />
        <Route path="/parent/approve"     element={<ParentApprovalPage />} />

        {/* ── Authenticated + role-protected routes ── */}
        <Route element={<AppShell />}>

          {/* Student */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/request/new" element={
            <ProtectedRoute allowedRoles={['student']}>
              <NewRequestPage />
            </ProtectedRoute>
          } />
          <Route path="/student/history" element={
            <ProtectedRoute allowedRoles={['student']}>
              <HistoryPage />
            </ProtectedRoute>
          } />

          {/* Warden */}
          <Route path="/warden/dashboard" element={
            <ProtectedRoute allowedRoles={['warden', 'admin']}>
              <WardenDashboard />
            </ProtectedRoute>
          } />
          <Route path="/warden/requests" element={
            <ProtectedRoute allowedRoles={['warden', 'admin']}>
              <WardenRequestsPage />
            </ProtectedRoute>
          } />
          <Route path="/warden/students" element={
            <ProtectedRoute allowedRoles={['warden', 'admin']}>
              <WardenStudentsPage />
            </ProtectedRoute>
          } />
          <Route path="/warden/emergency" element={
            <ProtectedRoute allowedRoles={['warden', 'admin']}>
              <WardenEmergencyPage />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminSettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/logs" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLogsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/violations" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminViolationsPage />
            </ProtectedRoute>
          } />

          {/* Catch-all redirect */}
          <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
        </Route>

        {/* ── Full-screen routes (outside AppShell) ── */}
        <Route path="/student/pass/:id" element={
          <ProtectedRoute allowedRoles={['student']}>
            <PassViewPage />
          </ProtectedRoute>
        } />
        <Route path="/guard/home" element={
          <ProtectedRoute allowedRoles={['guard', 'admin']}>
            <GuardHome />
          </ProtectedRoute>
        } />
        <Route path="/guard/scan" element={
          <ProtectedRoute allowedRoles={['guard', 'admin']}>
            <GuardHome />
          </ProtectedRoute>
        } />
        <Route path="/guard/scanner" element={
          <ProtectedRoute allowedRoles={['guard', 'admin']}>
            <GuardScannerPage />
          </ProtectedRoute>
        } />
        <Route path="/guard/verify/:id" element={
          <ProtectedRoute allowedRoles={['guard', 'admin']}>
            <GuardVerifyPage />
          </ProtectedRoute>
        } />
        <Route path="/guard/invalid" element={
          <ProtectedRoute allowedRoles={['guard', 'admin']}>
            <GuardInvalidPassPage />
          </ProtectedRoute>
        } />

      </Routes>
    </>
  );
};

export default App;
