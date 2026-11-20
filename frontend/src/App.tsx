import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SimulationProvider } from './context/SimulationContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { ComputerDetailPage } from './pages/ComputerDetailPage';
import { SimulationControlPage } from './pages/SimulationControlPage';
import { ScenarioSimulationPage } from './pages/ScenarioSimulationPage';
import { LaboratoryPage } from './pages/LaboratoryPage';
import { HardwareInventoryPage } from './pages/HardwareInventoryPage';
import { SoftwareManagementPage } from './pages/SoftwareManagementPage';
import { LicenseManagementPage } from './pages/LicenseManagementPage';
import { LabBookingPage } from './pages/LabBookingPage';
import { SessionManagementPage } from './pages/SessionManagementPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SimulationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="monitoring" element={<LiveMonitoringPage />} />
                  <Route path="computers/:id" element={<ComputerDetailPage />} />
                  <Route path="simulation-control" element={<SimulationControlPage />} />
                  <Route path="scenarios" element={<ScenarioSimulationPage />} />
                  <Route path="laboratories" element={<LaboratoryPage />} />
                  <Route path="hardware" element={<HardwareInventoryPage />} />
                  <Route path="software" element={<SoftwareManagementPage />} />
                  <Route path="licenses" element={<LicenseManagementPage />} />
                  <Route path="bookings" element={<LabBookingPage />} />
                  <Route path="sessions" element={<SessionManagementPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="alerts" element={<AlertsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </SimulationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
