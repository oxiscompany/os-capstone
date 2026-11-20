export interface SimulatedProcess {
  pid: number;
  name: str;
  cpu_percent: number;
  memory_mb: number;
  is_system: boolean;
  is_approved: boolean;
  started_at: string;
}

export interface Computer {
  computer_id: string;
  name: string;
  os_name: string;
  os_version: string;
  cpu_model: string;
  cpu_cores: number;
  ram_capacity_gb: number;
  storage_capacity_gb: number;
  ip_address: string;
  mac_address: string;
  status: 'online' | 'offline' | 'warning' | 'critical';
  health_score: number;
  cpu_percent: number;
  ram_percent: number;
  disk_percent: number;
  disk_health: number;
  network_rx_kbps: number;
  network_tx_kbps: number;
  uptime_seconds: number;
  active_user?: string | null;
  login_time?: string | null;
  session_duration_seconds: number;
  last_heartbeat: string;
  network_connected: boolean;
  hardware_fault: boolean;
  processes_count: number;
  processes?: SimulatedProcess[];
}

export interface MonitoringSummary {
  total_computers: number;
  online_computers: number;
  offline_computers: number;
  warning_computers: number;
  critical_computers: number;
  avg_cpu_percent: number;
  avg_ram_percent: number;
  avg_health_score: number;
}

export interface SimulationState {
  is_running: boolean;
  is_paused: boolean;
  speed_multiplier: number;
  interval_seconds: number;
  mode: string;
}

export interface TelemetrySnapshot {
  timestamp: string;
  simulation_state: SimulationState;
  summary: MonitoringSummary;
  computers: Computer[];
}

export interface MetricDataPoint {
  timestamp: string;
  cpu_percent: number;
  ram_percent: number;
  disk_percent: number;
  disk_health: number;
  network_rx_kbps: number;
  network_tx_kbps: number;
  health_score: number;
}

export interface Alert {
  id: number;
  computer_id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metric_name?: string;
  metric_value?: number;
  threshold_value?: number;
  is_acknowledged: boolean;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  is_resolved: boolean;
  resolved_at?: string | null;
  created_at: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  default_target: string;
  severity: string;
  category: string;
}

export interface ScenarioHistoryRecord {
  id: number;
  scenario_id: string;
  name: string;
  description: string;
  target_computer_id: string;
  trigger_conditions?: string;
  execution_status: string;
  start_time?: string;
  end_time?: string;
  recovery_status: string;
}

export interface HardwareItem {
  id: number;
  computer_id?: string;
  component_type: string;
  brand: string;
  model: string;
  serial_number: string;
  status: string;
  purchase_date: string;
  warranty_expiry?: string;
  notes?: string;
}

export interface SoftwareLicense {
  id: number;
  software_id: number;
  license_key: string;
  license_type: string;
  total_seats: number;
  used_seats: number;
  purchase_date: string;
  expiry_date?: string;
  cost: number;
}

export interface SoftwareItem {
  id: number;
  name: string;
  version: string;
  publisher?: string;
  category: string;
  is_approved: boolean;
  min_ram_gb: number;
  notes?: string;
  licenses?: SoftwareLicense[];
}

export interface LabBooking {
  id: number;
  lab_id: number;
  faculty_name: string;
  faculty_email?: string;
  department: string;
  purpose: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  attendees_count: number;
  created_at: string;
}

export interface ComputerSession {
  id: number;
  computer_id: string;
  user_name: string;
  login_time: string;
  logout_time?: string;
  duration_seconds: number;
  session_type: string;
  status: string;
}

export interface PredictiveMaintenanceForecast {
  computer_id: string;
  computer_name: string;
  failure_risk_score: number;
  maintenance_urgency: string;
  estimated_days_to_failure: number;
  recommended_action: string;
  risk_factors: string[];
}

export interface PredictiveMaintenanceResponse {
  disclaimer: string;
  high_risk_computers_count: number;
  medium_risk_computers_count: number;
  low_risk_computers_count: number;
  forecasts: PredictiveMaintenanceForecast[];
}
