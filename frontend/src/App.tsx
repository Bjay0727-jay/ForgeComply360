import React, { useState, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { SessionTimeoutModal } from './components/SessionTimeoutModal';
import { api } from './utils/api';
import { ExperienceProvider } from './hooks/useExperience';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useApiErrorToast } from './hooks/useApiErrorToast';
import { PageLoader } from './components/PageLoader';

// ============================================================================
// STATIC IMPORTS - Critical path pages (must load immediately)
// ============================================================================
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OnboardingWizard } from './pages/OnboardingWizard';
import { DashboardPage } from './pages/DashboardPage';  // Default route - keep static
import { BadgeVerifyPage } from './pages/BadgeVerifyPage';

// ============================================================================
// LAZY IMPORTS - Tier 1: Largest pages (50K+)
// Named export wrapper pattern: .then(m => ({ default: m.ComponentName }))
// ============================================================================
const ControlsPage = lazy(() => import('./pages/ControlsPage').then(m => ({ default: m.ControlsPage })));          // 70K
const AIWriterPage = lazy(() => import('./pages/AIWriterPage').then(m => ({ default: m.AIWriterPage })));          // 61K
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));          // 54K
const ImportPage = lazy(() => import('./pages/ImportPage').then(m => ({ default: m.ImportPage })));              // 50K

// ============================================================================
// LAZY IMPORTS - Tier 2: High priority pages (28-46K)
// ============================================================================
const RisksPage = lazy(() => import('./pages/RisksPage').then(m => ({ default: m.RisksPage })));                // 46K
const PoliciesPage = lazy(() => import('./pages/PoliciesPage').then(m => ({ default: m.PoliciesPage })));          // 43K
const SSPPage = lazy(() => import('./pages/SSPPage').then(m => ({ default: m.SSPPage })));                    // 36K
const FISMASSPBuilderPage = lazy(() => import('./pages/FISMASSPBuilderPage').then(m => ({ default: m.FISMASSPBuilderPage }))); // FISMA 23-section SSP
const AssessmentWizardPage = lazy(() => import('./pages/AssessmentWizardPage').then(m => ({ default: m.AssessmentWizardPage }))); // 35K
const VendorsPage = lazy(() => import('./pages/VendorsPage').then(m => ({ default: m.VendorsPage })));            // 34K
const MonitoringPage = lazy(() => import('./pages/MonitoringPage').then(m => ({ default: m.MonitoringPage })));      // 34K
const PoamsPage = lazy(() => import('./pages/PoamsPage').then(m => ({ default: m.PoamsPage })));                // 34K
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));                // 32K
const PortalBuilderPage = lazy(() => import('./pages/PortalBuilderPage').then(m => ({ default: m.PortalBuilderPage }))); // 28K
const PublicPortalPage = lazy(() => import('./pages/PublicPortalPage').then(m => ({ default: m.PublicPortalPage }))); // 28K

// ============================================================================
// LAZY IMPORTS - Tier 3: Medium pages (still beneficial to lazy load)
// ============================================================================
const ScanImportPage = lazy(() => import('./pages/ScanImportPage').then(m => ({ default: m.ScanImportPage })));      // 24K
const AssetsPage = lazy(() => import('./pages/AssetsPage').then(m => ({ default: m.AssetsPage })));                // 24K
const QuestionnaireBuilderPage = lazy(() => import('./pages/QuestionnaireBuilderPage').then(m => ({ default: m.QuestionnaireBuilderPage }))); // 23K
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));          // 19K
const SystemComparisonPage = lazy(() => import('./pages/SystemComparisonPage').then(m => ({ default: m.SystemComparisonPage }))); // 19K
const SSPComparisonPage = lazy(() => import('./pages/SSPComparisonPage').then(m => ({ default: m.SSPComparisonPage }))); // 19K
const EvidenceSchedulesPage = lazy(() => import('./pages/EvidenceSchedulesPage').then(m => ({ default: m.EvidenceSchedulesPage }))); // 17K
const AuditLogPage = lazy(() => import('./pages/AuditLogPage').then(m => ({ default: m.AuditLogPage })));          // 16K
const EvidenceAutomationPage = lazy(() => import('./pages/EvidenceAutomationPage').then(m => ({ default: m.EvidenceAutomationPage }))); // 16K
const AuditPrepPage = lazy(() => import('./pages/AuditPrepPage').then(m => ({ default: m.AuditPrepPage })));        // 16K
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage').then(m => ({ default: m.ApprovalsPage })));        // 15K
const PublicQuestionnairePage = lazy(() => import('./pages/PublicQuestionnairePage').then(m => ({ default: m.PublicQuestionnairePage }))); // 14K
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));            // 13K
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));      // 15K
const AuditorPortalsPage = lazy(() => import('./pages/AuditorPortalsPage').then(m => ({ default: m.AuditorPortalsPage }))); // 13K
const SystemsPage = lazy(() => import('./pages/SystemsPage').then(m => ({ default: m.SystemsPage })));            // 12K
const EvidenceTestResultsPage = lazy(() => import('./pages/EvidenceTestResultsPage').then(m => ({ default: m.EvidenceTestResultsPage }))); // 12K
const EvidencePage = lazy(() => import('./pages/EvidencePage').then(m => ({ default: m.EvidencePage })));          // 11K
const QuestionnairesPage = lazy(() => import('./pages/QuestionnairesPage').then(m => ({ default: m.QuestionnairesPage }))); // 11K
const ConnectorsPage = lazy(() => import('./pages/ConnectorsPage').then(m => ({ default: m.ConnectorsPage })));      // 11K
const ServiceNowPage = lazy(() => import('./pages/ServiceNowPage').then(m => ({ default: m.ServiceNowPage })));      // 12K
const QuestionnaireResponsesPage = lazy(() => import('./pages/QuestionnaireResponsesPage').then(m => ({ default: m.QuestionnaireResponsesPage }))); // 10K
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage }))); // 9K
const PortalActivityPage = lazy(() => import('./pages/PortalActivityPage').then(m => ({ default: m.PortalActivityPage }))); // 7K
const CrosswalksPage = lazy(() => import('./pages/CrosswalksPage').then(m => ({ default: m.CrosswalksPage })));      // 5K
const LegalPage = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })));                    // 3K
const SecurityIncidentsPage = lazy(() => import('./pages/SecurityIncidentsPage').then(m => ({ default: m.SecurityIncidentsPage }))); // 10K

/** Bridge: subscribes to API errors and shows toast notifications */
function ApiErrorBridge() {
  useApiErrorToast();
  return null;
}

/** Bridge: idle session timeout — shows warning modal and auto-logs out */
function IdleTimeoutBridge() {
  const { logout, sessionTimeoutMinutes } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  const handleWarning = useCallback(() => setShowWarning(true), []);
  const handleTimeout = useCallback(() => {
    setShowWarning(false);
    logout();
    window.location.href = '/login?expired=1';
  }, [logout]);

  const { resetTimer } = useIdleTimeout({
    timeoutMinutes: sessionTimeoutMinutes,
    warningSeconds: 30,
    onWarning: handleWarning,
    onTimeout: handleTimeout,
    enabled: true,
  });

  const handleStayLoggedIn = useCallback(() => {
    setShowWarning(false);
    resetTimer();
    // Trigger a token refresh to extend the session
    api('/api/v1/auth/me').catch(() => {});
  }, [resetTimer]);

  return (
    <SessionTimeoutModal
      isOpen={showWarning}
      onStayLoggedIn={handleStayLoggedIn}
      onLogout={handleTimeout}
    />
  );
}

/** Helper component to wrap lazy-loaded pages with Suspense */
function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function AppRoutes() {
  const { user, org, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Forge Cyber Defense...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Public routes - no auth required */}
        <Route path="/verify/:code" element={<BadgeVerifyPage />} />
        <Route path="/q/:token" element={<LazyPage><PublicQuestionnairePage /></LazyPage>} />
        <Route path="/portal/:token" element={<LazyPage><PublicPortalPage /></LazyPage>} />
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
        <IdleTimeoutBridge />
        <Routes>
          {/* Overview — all authenticated users */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/notifications" element={<LazyPage><NotificationsPage /></LazyPage>} />
          <Route path="/calendar" element={<ProtectedRoute minRole="analyst"><LazyPage><CalendarPage /></LazyPage></ProtectedRoute>} />

          {/* Compliance */}
          <Route path="/systems" element={<LazyPage><SystemsPage /></LazyPage>} />
          <Route path="/controls" element={<LazyPage><ControlsPage /></LazyPage>} />
          <Route path="/crosswalks" element={<LazyPage><CrosswalksPage /></LazyPage>} />
          <Route path="/assessment" element={<ProtectedRoute minRole="analyst"><LazyPage><AssessmentWizardPage /></LazyPage></ProtectedRoute>} />
          <Route path="/system-comparison" element={<ProtectedRoute minRole="analyst"><LazyPage><SystemComparisonPage /></LazyPage></ProtectedRoute>} />
          {/* Questionnaires */}
          <Route path="/questionnaires" element={<ProtectedRoute minRole="manager"><LazyPage><QuestionnairesPage /></LazyPage></ProtectedRoute>} />
          <Route path="/questionnaires/new" element={<ProtectedRoute minRole="manager"><LazyPage><QuestionnaireBuilderPage /></LazyPage></ProtectedRoute>} />
          <Route path="/questionnaires/:id/edit" element={<ProtectedRoute minRole="manager"><LazyPage><QuestionnaireBuilderPage /></LazyPage></ProtectedRoute>} />
          <Route path="/questionnaires/:id/responses" element={<ProtectedRoute minRole="manager"><LazyPage><QuestionnaireResponsesPage /></LazyPage></ProtectedRoute>} />

          {/* Remediation */}
          <Route path="/poams" element={<LazyPage><PoamsPage /></LazyPage>} />
          <Route path="/evidence" element={<LazyPage><EvidencePage /></LazyPage>} />
          <Route path="/evidence/schedules" element={<ProtectedRoute minRole="analyst"><LazyPage><EvidenceSchedulesPage /></LazyPage></ProtectedRoute>} />
          <Route path="/evidence/automation" element={<ProtectedRoute minRole="manager"><LazyPage><EvidenceAutomationPage /></LazyPage></ProtectedRoute>} />
          <Route path="/evidence/tests/:id/results" element={<ProtectedRoute minRole="manager"><LazyPage><EvidenceTestResultsPage /></LazyPage></ProtectedRoute>} />
          <Route path="/approvals" element={<ProtectedRoute minRole="analyst"><LazyPage><ApprovalsPage /></LazyPage></ProtectedRoute>} />

          {/* Documentation */}
          <Route path="/ssp" element={<LazyPage><SSPPage /></LazyPage>} />
          <Route path="/ssp/fisma/:id" element={<ProtectedRoute minRole="analyst"><LazyPage><FISMASSPBuilderPage /></LazyPage></ProtectedRoute>} />
          <Route path="/ssp/compare" element={<ProtectedRoute minRole="analyst"><LazyPage><SSPComparisonPage /></LazyPage></ProtectedRoute>} />
          <Route path="/policies" element={<LazyPage><PoliciesPage /></LazyPage>} />
          <Route path="/audit-prep" element={<ProtectedRoute minRole="analyst"><LazyPage><AuditPrepPage /></LazyPage></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute minRole="manager"><LazyPage><ReportsPage /></LazyPage></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute minRole="analyst"><LazyPage><AnalyticsPage /></LazyPage></ProtectedRoute>} />

          {/* Risk & Monitoring */}
          <Route path="/risks" element={<LazyPage><RisksPage /></LazyPage>} />
          <Route path="/monitoring" element={<LazyPage><MonitoringPage /></LazyPage>} />
          <Route path="/vendors" element={<LazyPage><VendorsPage /></LazyPage>} />
          <Route path="/scans" element={<ProtectedRoute minRole="analyst"><LazyPage><ScanImportPage /></LazyPage></ProtectedRoute>} />
          <Route path="/assets" element={<LazyPage><AssetsPage /></LazyPage>} />
          <Route path="/security-incidents" element={<ProtectedRoute minRole="admin"><LazyPage><SecurityIncidentsPage /></LazyPage></ProtectedRoute>} />

          {/* Tools */}
          <Route path="/ai-writer" element={<LazyPage><AIWriterPage /></LazyPage>} />
          <Route path="/import" element={<ProtectedRoute minRole="manager"><LazyPage><ImportPage /></LazyPage></ProtectedRoute>} />

          {/* Administration */}
          <Route path="/users" element={<ProtectedRoute minRole="admin"><LazyPage><UsersPage /></LazyPage></ProtectedRoute>} />
          <Route path="/connectors" element={<ProtectedRoute minRole="admin"><LazyPage><ConnectorsPage /></LazyPage></ProtectedRoute>} />
          <Route path="/servicenow" element={<ProtectedRoute minRole="manager"><LazyPage><ServiceNowPage /></LazyPage></ProtectedRoute>} />
          <Route path="/portals" element={<ProtectedRoute minRole="admin"><LazyPage><AuditorPortalsPage /></LazyPage></ProtectedRoute>} />
          <Route path="/portals/new" element={<ProtectedRoute minRole="admin"><LazyPage><PortalBuilderPage /></LazyPage></ProtectedRoute>} />
          <Route path="/portals/:id/edit" element={<ProtectedRoute minRole="admin"><LazyPage><PortalBuilderPage /></LazyPage></ProtectedRoute>} />
          <Route path="/portals/:id/activity" element={<ProtectedRoute minRole="admin"><LazyPage><PortalActivityPage /></LazyPage></ProtectedRoute>} />
          <Route path="/audit-log" element={<ProtectedRoute minRole="admin"><LazyPage><AuditLogPage /></LazyPage></ProtectedRoute>} />
          <Route path="/settings" element={<LazyPage><SettingsPage /></LazyPage>} />
          <Route path="/legal" element={<LazyPage><LegalPage /></LazyPage>} />

          {/* Public routes also accessible when logged in */}
          <Route path="/verify/:code" element={<BadgeVerifyPage />} />
          <Route path="/q/:token" element={<LazyPage><PublicQuestionnairePage /></LazyPage>} />
          <Route path="/portal/:token" element={<LazyPage><PublicPortalPage /></LazyPage>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ExperienceProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <ApiErrorBridge />
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
