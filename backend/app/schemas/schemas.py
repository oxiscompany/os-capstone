"""
Pydantic Request & Response schemas for LabNexus APIs.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Processes ---
class ProcessOut(BaseModel):
    pid: int
    name: str
    cpu_percent: float
    memory_mb: float
    is_system: bool
    is_approved: bool
    started_at: str

class ProcessStartRequest(BaseModel):
    name: str
    base_cpu: float = 15.0
    base_ram_mb: float = 400.0
    is_approved: bool = True

# --- Computers ---
class ComputerOut(BaseModel):
    computer_id: str
    name: str
    os_name: str
    os_version: str
    cpu_model: str
    cpu_cores: int
    ram_capacity_gb: float
    storage_capacity_gb: float
    ip_address: str
    mac_address: str
    status: str
    health_score: float
    cpu_percent: float
    ram_percent: float
    disk_percent: float
    disk_health: float
    network_rx_kbps: float
    network_tx_kbps: float
    uptime_seconds: int
    active_user: Optional[str] = None
    login_time: Optional[str] = None
    session_duration_seconds: int = 0
    last_heartbeat: str
    network_connected: bool
    hardware_fault: bool
    processes_count: int

class ComputerDetailOut(ComputerOut):
    processes: List[ProcessOut] = []

class ComputerUpdate(BaseModel):
    name: Optional[str] = None
    os_name: Optional[str] = None
    ram_capacity_gb: Optional[float] = None
    storage_capacity_gb: Optional[float] = None

# --- Simulation & Manual Controls ---
class SimulationStateOut(BaseModel):
    is_running: bool
    is_paused: bool
    speed_multiplier: float
    interval_seconds: float
    mode: str

class ManualSimulationRequest(BaseModel):
    cpu_override: Optional[float] = None
    ram_override: Optional[float] = None
    disk_override: Optional[float] = None
    disk_health_override: Optional[float] = None
    disconnect_network: Optional[bool] = None
    trigger_fault: Optional[bool] = None
    restore_health: Optional[bool] = None

# --- Scenarios ---
class ScenarioRunRequest(BaseModel):
    scenario_id: str
    target_pc_id: Optional[str] = None

class ScenarioOut(BaseModel):
    id: int
    scenario_id: str
    name: str
    description: str
    target_computer_id: str
    trigger_conditions: Optional[str] = None
    execution_status: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    recovery_status: str

# --- Alerts ---
class AlertOut(BaseModel):
    id: int
    computer_id: str
    alert_type: str
    severity: str
    title: str
    message: str
    metric_name: Optional[str] = None
    metric_value: Optional[float] = None
    threshold_value: Optional[float] = None
    is_acknowledged: bool
    acknowledged_at: Optional[str] = None
    acknowledged_by: Optional[str] = None
    is_resolved: bool
    resolved_at: Optional[str] = None
    created_at: str

class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: str = "Admin"

# --- Hardware Inventory ---
class HardwareItemOut(BaseModel):
    id: int
    computer_id: Optional[str] = None
    component_type: str
    brand: str
    model: str
    serial_number: str
    status: str
    purchase_date: datetime
    warranty_expiry: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class HardwareItemCreate(BaseModel):
    computer_id: Optional[str] = None
    component_type: str
    brand: str
    model: str
    serial_number: str
    status: str = "operational"
    warranty_expiry: Optional[datetime] = None
    notes: Optional[str] = None

# --- Software & Licenses ---
class LicenseOut(BaseModel):
    id: int
    software_id: int
    license_key: str
    license_type: str
    total_seats: int
    used_seats: int
    purchase_date: datetime
    expiry_date: Optional[datetime] = None
    cost: float

    class Config:
        from_attributes = True

class SoftwareItemOut(BaseModel):
    id: int
    name: str
    version: str
    publisher: Optional[str] = None
    category: str
    is_approved: bool
    min_ram_gb: float
    notes: Optional[str] = None
    licenses: List[LicenseOut] = []

    class Config:
        from_attributes = True

class SoftwareItemCreate(BaseModel):
    name: str
    version: str
    publisher: Optional[str] = None
    category: str = "Development"
    is_approved: bool = True
    min_ram_gb: float = 2.0
    notes: Optional[str] = None

class LicenseCreate(BaseModel):
    software_id: int
    license_key: str
    license_type: str = "Perpetual"
    total_seats: int = 30
    used_seats: int = 10
    expiry_date: Optional[datetime] = None
    cost: float = 0.0

# --- Lab Bookings & Conflict Detection ---
class LabBookingOut(BaseModel):
    id: int
    lab_id: int
    faculty_name: str
    faculty_email: Optional[str] = None
    department: str
    purpose: str
    booking_date: str
    start_time: str
    end_time: str
    status: str
    attendees_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class LabBookingCreate(BaseModel):
    lab_id: int = 1
    faculty_name: str
    faculty_email: Optional[str] = None
    department: str = "Computer Science"
    purpose: str
    booking_date: str # YYYY-MM-DD
    start_time: str # HH:MM (24h)
    end_time: str   # HH:MM (24h)
    attendees_count: int = 25

# --- Sessions ---
class SessionOut(BaseModel):
    id: int
    computer_id: str
    user_name: str
    login_time: datetime
    logout_time: Optional[datetime] = None
    duration_seconds: int
    session_type: str
    status: str

    class Config:
        from_attributes = True

class SessionLoginRequest(BaseModel):
    computer_id: str
    user_name: str
    session_type: str = "Student Lab Work"

# --- Telemetry & Analytics ---
class MetricDataPoint(BaseModel):
    timestamp: str
    cpu_percent: float
    ram_percent: float
    disk_percent: float
    disk_health: float
    network_rx_kbps: float
    network_tx_kbps: float
    health_score: float

class MonitoringSummaryOut(BaseModel):
    total_computers: int
    online_computers: int
    offline_computers: int
    warning_computers: int
    critical_computers: int
    avg_cpu_percent: float
    avg_ram_percent: float
    avg_health_score: float
