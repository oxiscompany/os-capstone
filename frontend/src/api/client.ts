import {
  Computer, TelemetrySnapshot, MetricDataPoint, Alert,
  Scenario, ScenarioHistoryRecord, HardwareItem, SoftwareItem,
  SoftwareLicense, LabBooking, ComputerSession,
  PredictiveMaintenanceResponse
} from './types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('labnexus_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: str }) =>
    fetchJson<{ access_token: string; token_type: string; username: string; role: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => fetchJson<{ id: number; username: string; email: string; role: string }>('/auth/me'),

  // Simulation Controls
  startSimulation: () => fetchJson<{ status: string }>('/simulation/start', { method: 'POST' }),
  pauseSimulation: () => fetchJson<{ status: string }>('/simulation/pause', { method: 'POST' }),
  resumeSimulation: () => fetchJson<{ status: string }>('/simulation/resume', { method: 'POST' }),
  stopSimulation: () => fetchJson<{ status: string }>('/simulation/stop', { method: 'POST' }),
  resetSimulation: () => fetchJson<{ status: string }>('/simulation/reset', { method: 'POST' }),
  getSimulationStatus: () => fetchJson<any>('/simulation/status'),
  setSimulationConfig: (cfg: { speed_multiplier: number; interval_seconds?: number }) =>
    fetchJson<any>('/simulation/config', { method: 'POST', body: JSON.stringify(cfg) }),
  getSimulationEvents: (limit: number = 50) => fetchJson<any[]>(`/simulation/events?limit=${limit}`),

  // Computers
  getComputers: () => fetchJson<Computer[]>('/computers'),
  getComputerDetail: (id: string) => fetchJson<any>(`/computers/${id}`),
  updateComputer: (id: string, update: any) =>
    fetchJson<Computer>(`/computers/${id}`, { method: 'PUT', body: JSON.stringify(update) }),

  // Manual Simulation & Injections
  simulateComputer: (id: string, params: any) =>
    fetchJson<any>(`/computers/${id}/simulate`, { method: 'POST', body: JSON.stringify(params) }),
  disconnectNetwork: (id: string) =>
    fetchJson<any>(`/computers/${id}/disconnect`, { method: 'POST' }),
  reconnectNetwork: (id: string) =>
    fetchJson<any>(`/computers/${id}/reconnect`, { method: 'POST' }),
  recoverComputer: (id: string) =>
    fetchJson<any>(`/computers/${id}/recover`, { method: 'POST' }),
  startProcess: (id: string, proc: { name: string; base_cpu?: number; base_ram_mb?: number; is_approved?: boolean }) =>
    fetchJson<any>(`/computers/${id}/processes/start`, { method: 'POST', body: JSON.stringify(proc) }),
  stopProcess: (id: string, pid: number) =>
    fetchJson<any>(`/computers/${id}/processes/${pid}/stop`, { method: 'POST' }),
  simulateLogin: (id: string, username: string) =>
    fetchJson<any>(`/computers/${id}/login`, { method: 'POST', body: JSON.stringify({ username }) }),
  simulateLogout: (id: string) =>
    fetchJson<any>(`/computers/${id}/logout`, { method: 'POST' }),

  // Monitoring
  getLiveMetrics: () => fetchJson<TelemetrySnapshot>('/metrics/live'),
  getMetricsHistory: (id: string, limit: number = 30) =>
    fetchJson<MetricDataPoint[]>(`/metrics/history/${id}?limit=${limit}`),
  getMonitoringSummary: () => fetchJson<any>('/monitoring/summary'),

  // Scenarios
  getScenarios: () => fetchJson<Scenario[]>('/scenarios'),
  runScenario: (scenario_id: string, target_pc_id?: string) =>
    fetchJson<any>('/scenarios/run', { method: 'POST', body: JSON.stringify({ scenario_id, target_pc_id }) }),
  getScenarioHistory: (limit: number = 30) =>
    fetchJson<ScenarioHistoryRecord[]>(`/scenarios/history?limit=${limit}`),

  // Alerts
  getAlerts: (params?: { severity?: string; computer_id?: string; unacknowledged_only?: boolean; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.severity) q.append('severity', params.severity);
    if (params?.computer_id) q.append('computer_id', params.computer_id);
    if (params?.unacknowledged_only) q.append('unacknowledged_only', 'true');
    if (params?.limit) q.append('limit', params.limit.toString());
    return fetchJson<Alert[]>(`/alerts?${q.toString()}`);
  },
  acknowledgeAlert: (alert_id: number, acknowledged_by: string = 'Admin') =>
    fetchJson<Alert>(`/alerts/${alert_id}/acknowledge`, {
      method: 'PUT',
      body: JSON.stringify({ acknowledged_by }),
    }),
  getAlertsSummary: () => fetchJson<any>('/alerts/summary'),

  // Analytics & Predictive Maintenance
  getAnalyticsSummary: () => fetchJson<any>('/analytics/summary'),
  getUtilization: () => fetchJson<any[]>('/analytics/utilization'),
  getHealthBreakdown: () => fetchJson<any[]>('/analytics/health'),
  getPredictiveMaintenance: () => fetchJson<PredictiveMaintenanceResponse>('/analytics/predictive-maintenance'),

  // Resources
  getHardware: (computer_id?: string) => {
    const q = computer_id ? `?computer_id=${computer_id}` : '';
    return fetchJson<HardwareItem[]>(`/resources/hardware${q}`);
  },
  createHardware: (item: any) =>
    fetchJson<HardwareItem>('/resources/hardware', { method: 'POST', body: JSON.stringify(item) }),
  getSoftware: () => fetchJson<SoftwareItem[]>('/resources/software'),
  createSoftware: (item: any) =>
    fetchJson<SoftwareItem>('/resources/software', { method: 'POST', body: JSON.stringify(item) }),
  getLicenses: () => fetchJson<SoftwareLicense[]>('/resources/licenses'),
  createLicense: (item: any) =>
    fetchJson<SoftwareLicense>('/resources/licenses', { method: 'POST', body: JSON.stringify(item) }),
  getBookings: (date?: string) => {
    const q = date ? `?date=${date}` : '';
    return fetchJson<LabBooking[]>(`/resources/bookings${q}`);
  },
  createBooking: (booking: any) =>
    fetchJson<LabBooking>('/resources/bookings', { method: 'POST', body: JSON.stringify(booking) }),
  cancelBooking: (id: number) =>
    fetchJson<any>(`/resources/bookings/${id}/cancel`, { method: 'PUT' }),
  getSessions: (computer_id?: string) => {
    const q = computer_id ? `?computer_id=${computer_id}` : '';
    return fetchJson<ComputerSession[]>(`/resources/sessions${q}`);
  },
};
