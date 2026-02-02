import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ExperienceProvider } from './hooks/useExperience';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingWizard } from './pages/OnboardingWizard';
import { DashboardPage } from './pages/DashboardPage';
import { SystemsPage } from './pages/SystemsPage';
import { ControlsPage } from './pages/ControlsPage';
import { PoamsPage } from './pages/PoamsPage';
import { EvidencePage } from './pages/EvidencePage';
import { SSPPage } from './pages/SSPPage';
import { RisksPage } from './pages/RisksPage';
import { VendorsPage } from './pages/VendorsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CrosswalksPage } from './pages/CrosswalksPage';
import { AIWriterPage } from './pages/AIWriterPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ImportPage } from './pages/ImportPage';
import { ApprovalsPage } from './pages/ApprovalsPage';

function AppRoutes() {
  const { user, org, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading ForgeComply 360...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!user.onboarding_completed) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <ExperienceProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/systems" element={<SystemsPage />} />
          <Route path="/controls" element={<ControlsPage />} />
          <Route path="/poams" element={<PoamsPage />} />
          <Route path="/evidence" element={<EvidencePage />} />
          <Route path="/ssp" element={<SSPPage />} />
          <Route path="/risks" element={<RisksPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/crosswalks" element={<CrosswalksPage />} />
          <Route path="/ai-writer" element={<AIWriterPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ExperienceProvider>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
