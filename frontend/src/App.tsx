import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './layouts/AppShell';

// Pages
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
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Magic Link Parent Portal (No auth required) */}
      <Route path="/parent/approve/:id" element={<ParentApprovalPage />} />
      <Route path="/parent/approve" element={<ParentApprovalPage />} />

      {/* Auth'd Routes */}
      <Route element={<AppShell />}>
        {/* Student Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/request/new" element={<NewRequestPage />} />
        <Route path="/student/history" element={<HistoryPage />} />
        
        {/* Warden Routes */}
        <Route path="/warden/dashboard" element={<WardenDashboard />} />
        <Route path="/warden/requests" element={<WardenRequestsPage />} />
        <Route path="/warden/students" element={<WardenStudentsPage />} />
        <Route path="/warden/emergency" element={<WardenEmergencyPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/logs" element={<AdminLogsPage />} />
        <Route path="/admin/violations" element={<AdminViolationsPage />} />

        {/* Global redirect - will be captured by AppShell if no user */}
        <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
      </Route>

      {/* Full-screen specific routes outside AppShell */}
      <Route path="/student/pass/:id" element={<PassViewPage />} />
      <Route path="/guard/home" element={<GuardHome />} />
      <Route path="/guard/scan" element={<GuardHome />} />
      <Route path="/guard/scanner" element={<GuardScannerPage />} />
      <Route path="/guard/verify/:id" element={<GuardVerifyPage />} />
      <Route path="/guard/invalid" element={<GuardInvalidPassPage />} />
      
    </Routes>
  );
};

export default App;
