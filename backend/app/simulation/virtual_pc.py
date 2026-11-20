"""
Virtual Computer Instance representation for LabNexus.
Each instance maintains an independent, realistic computer simulation with its own
hardware profile, metrics generation, running processes, user session, and network state.
"""
import random
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

class SimulatedProcess:
    def __init__(self, pid: int, name: str, base_cpu: float, base_ram_mb: float, is_system: bool = False, is_approved: bool = True):
        self.pid = pid
        self.name = name
        self.base_cpu = base_cpu
        self.base_ram_mb = base_ram_mb
        self.is_system = is_system
        self.is_approved = is_approved
        self.cpu_percent = base_cpu
        self.ram_mb = base_ram_mb
        self.started_at = datetime.utcnow()

    def update(self, workload_factor: float = 1.0):
        # Fluctuate process resource consumption realistically
        if self.is_system:
            noise = random.uniform(-0.5, 0.5)
            self.cpu_percent = max(0.2, min(5.0, self.base_cpu + noise))
            self.ram_mb = max(100.0, self.base_ram_mb + random.uniform(-5, 5))
        else:
            noise = random.uniform(-1.5, 2.5) * workload_factor
            self.cpu_percent = max(0.5, min(60.0, (self.base_cpu * workload_factor) + noise))
            self.ram_mb = max(50.0, (self.base_ram_mb * (1.0 + (workload_factor - 1.0) * 0.3)) + random.uniform(-10, 15))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pid": self.pid,
            "name": self.name,
            "cpu_percent": round(self.cpu_percent, 1),
            "memory_mb": round(self.ram_mb, 1),
            "is_system": self.is_system,
            "is_approved": self.is_approved,
            "started_at": self.started_at.isoformat()
        }


class VirtualComputer:
    """
    Independent Virtual Computer instance.
    Generates realistic, uncorrelated telemetry and handles fault injection.
    """
    def __init__(
        self,
        computer_id: str,
        name: str,
        os_name: str,
        os_version: str,
        cpu_model: str,
        cpu_cores: int,
        ram_capacity_gb: float,
        storage_capacity_gb: float,
        ip_address: str,
        mac_address: str,
        default_user: Optional[str] = None
    ):
        self.computer_id = computer_id
        self.name = name
        self.os_name = os_name
        self.os_version = os_version
        self.cpu_model = cpu_model
        self.cpu_cores = cpu_cores
        self.ram_capacity_gb = ram_capacity_gb
        self.storage_capacity_gb = storage_capacity_gb
        self.ip_address = ip_address
        self.mac_address = mac_address

        # State flags
        self.is_powered_on: bool = True
        self.network_connected: bool = True
        self.hardware_fault: bool = False
        self.status: str = "online" # online, offline, warning, critical
        self.health_score: float = 100.0

        # Overrides / Injections (None when normal simulation)
        self.manual_cpu_override: Optional[float] = None
        self.manual_ram_override: Optional[float] = None
        self.manual_disk_override: Optional[float] = None
        self.manual_disk_health_override: Optional[float] = None

        # Metrics
        self.cpu_percent: float = round(random.uniform(12.0, 25.0), 1)
        self.ram_percent: float = round(random.uniform(28.0, 42.0), 1)
        self.disk_percent: float = round(random.uniform(40.0, 65.0), 1)
        self.disk_health: float = 100.0 # 0 - 100%
        self.network_rx_kbps: float = round(random.uniform(50.0, 350.0), 1)
        self.network_tx_kbps: float = round(random.uniform(20.0, 180.0), 1)
        self.uptime_seconds: int = random.randint(1800, 36000)
        self.last_heartbeat: datetime = datetime.utcnow()

        # Processes
        self.next_pid: int = 1000
        self.processes: List[SimulatedProcess] = []
        self._initialize_default_processes()

        # Session
        self.active_user: Optional[str] = default_user
        self.login_time: Optional[datetime] = datetime.utcnow() if default_user else None
        self.session_duration_seconds: int = 0

    def _get_next_pid(self) -> int:
        self.next_pid += random.randint(4, 18)
        return self.next_pid

    def _initialize_default_processes(self):
        """Seed typical OS and user background processes"""
        if "Windows" in self.os_name:
            self.processes = [
                SimulatedProcess(self._get_next_pid(), "System", 0.8, 180.0, is_system=True),
                SimulatedProcess(self._get_next_pid(), "csrss.exe", 0.3, 90.0, is_system=True),
                SimulatedProcess(self._get_next_pid(), "explorer.exe", 1.8, 240.0, is_system=True),
                SimulatedProcess(self._get_next_pid(), "MsMpEng.exe (Defender)", 2.4, 380.0, is_system=True),
                SimulatedProcess(self._get_next_pid(), "chrome.exe", 5.5, 950.0, is_system=False),
                SimulatedProcess(self._get_next_pid(), "code.exe (VS Code)", 4.0, 620.0, is_system=False),
            ]
        else:
            self.processes = [
                SimulatedProcess(1, "systemd", 0.5, 120.0, is_system=True),
                SimulatedProcess(self._get_next_pid(), "dbus-daemon", 0.2, 45.0, is_system=True),
                SimulatedProcess(self._get_next_pid(), "gnome-shell", 2.2, 410.0, is_system=True),
                SimulatedProcess(self._get_next_pid(), "apparmor", 0.4, 75.0, is_system=True),
                SimulatedProcess(self._get_next_pid(), "python3 (DataLab)", 6.5, 850.0, is_system=False),
                SimulatedProcess(self._get_next_pid(), "vscode", 4.2, 680.0, is_system=False),
            ]

    def add_process(self, name: str, base_cpu: float = 15.0, base_ram_mb: float = 400.0, is_approved: bool = True) -> SimulatedProcess:
        proc = SimulatedProcess(
            pid=self._get_next_pid(),
            name=name,
            base_cpu=base_cpu,
            base_ram_mb=base_ram_mb,
            is_system=False,
            is_approved=is_approved
        )
        self.processes.append(proc)
        return proc

    def terminate_process(self, pid: int) -> bool:
        for i, proc in enumerate(self.processes):
            if proc.pid == pid and not proc.is_system:
                self.processes.pop(i)
                return True
        return False

    def simulate_login(self, username: str):
        self.active_user = username
        self.login_time = datetime.utcnow()
        self.session_duration_seconds = 0
        # Add typical user apps
        self.add_process("browser.exe", base_cpu=6.0, base_ram_mb=600.0)

    def simulate_logout(self):
        self.active_user = None
        self.login_time = None
        self.session_duration_seconds = 0
        # Remove non-system processes
        self.processes = [p for p in self.processes if p.is_system]

    def trigger_hardware_fault(self):
        self.hardware_fault = True
        self.manual_disk_health_override = 15.0
        self.status = "critical"

    def restore_health(self):
        self.manual_cpu_override = None
        self.manual_ram_override = None
        self.manual_disk_override = None
        self.manual_disk_health_override = None
        self.hardware_fault = False
        self.network_connected = True
        self.disk_health = 100.0
        self.is_powered_on = True
        # Remove unapproved apps
        self.processes = [p for p in self.processes if p.is_approved]
        self.status = "online"

    def tick(self, interval_seconds: float = 2.0):
        """
        Advance one simulation step. Generates realistic fluctuations and updates state.
        """
        if not self.is_powered_on:
            self.status = "offline"
            self.cpu_percent = 0.0
            self.ram_percent = 0.0
            self.network_rx_kbps = 0.0
            self.network_tx_kbps = 0.0
            return

        self.uptime_seconds += int(interval_seconds)
        if self.active_user:
            self.session_duration_seconds += int(interval_seconds)

        # Update running processes
        workload_factor = 1.0
        if self.hardware_fault:
            workload_factor = 1.8

        total_proc_cpu = 0.0
        total_proc_ram_mb = 0.0
        for proc in self.processes:
            proc.update(workload_factor)
            total_proc_cpu += proc.cpu_percent
            total_proc_ram_mb += proc.ram_mb

        # Calculate CPU
        if self.manual_cpu_override is not None:
            # Overridden explicitly by scenario or manual control
            self.cpu_percent = round(min(100.0, max(0.0, self.manual_cpu_override + random.uniform(-0.8, 0.8))), 1)
        else:
            base_os_cpu = random.uniform(3.0, 7.0)
            core_mitigation = max(1.0, self.cpu_cores / 4.0)
            computed_cpu = base_os_cpu + (total_proc_cpu / core_mitigation)
            # Add slight smooth wandering
            computed_cpu += random.uniform(-2.0, 2.0)
            self.cpu_percent = round(max(2.0, min(100.0, computed_cpu)), 1)

        # Calculate RAM
        if self.manual_ram_override is not None:
            self.ram_percent = round(min(100.0, max(0.0, self.manual_ram_override + random.uniform(-0.5, 0.5))), 1)
        else:
            base_os_ram_mb = 2048.0 # 2GB for OS
            total_ram_used_mb = base_os_ram_mb + total_proc_ram_mb
            total_ram_capacity_mb = self.ram_capacity_gb * 1024.0
            computed_ram_percent = (total_ram_used_mb / total_ram_capacity_mb) * 100.0
            self.ram_percent = round(max(10.0, min(100.0, computed_ram_percent)), 1)

        # Calculate Disk Usage & Health
        if self.manual_disk_override is not None:
            self.disk_percent = round(min(100.0, max(0.0, self.manual_disk_override)), 1)
        else:
            # Slow gradual drift
            self.disk_percent = round(max(10.0, min(99.0, self.disk_percent + random.uniform(-0.02, 0.03))), 1)

        if self.manual_disk_health_override is not None:
            self.disk_health = round(max(0.0, min(100.0, self.manual_disk_health_override)), 1)
        else:
            if self.hardware_fault:
                self.disk_health = max(5.0, self.disk_health - random.uniform(0.5, 1.5))
            else:
                self.disk_health = min(100.0, self.disk_health)

        # Network Activity & Heartbeat
        if not self.network_connected:
            self.network_rx_kbps = 0.0
            self.network_tx_kbps = 0.0
            # Network cut -> Heartbeat stops updating!
        else:
            self.last_heartbeat = datetime.utcnow()
            if self.cpu_percent > 85.0:
                # Heavy workload network spike
                self.network_rx_kbps = round(random.uniform(500.0, 2500.0), 1)
                self.network_tx_kbps = round(random.uniform(200.0, 1100.0), 1)
            else:
                # Normal background network activity
                self.network_rx_kbps = round(random.uniform(15.0, 180.0), 1)
                self.network_tx_kbps = round(random.uniform(5.0, 60.0), 1)

        # Update Composite Health Score (0 - 100)
        self.health_score = self.compute_health_score()

        # Update Machine Status
        if not self.network_connected:
            # Let engine determine offline after timeout, but mark disconnected
            pass
        elif self.health_score < 40.0 or self.cpu_percent >= 95.0 or self.ram_percent >= 95.0 or self.disk_health <= 20.0:
            self.status = "critical"
        elif self.health_score < 75.0 or self.cpu_percent >= 80.0 or self.ram_percent >= 85.0 or self.disk_percent >= 90.0:
            self.status = "warning"
        else:
            self.status = "online"

    def compute_health_score(self) -> float:
        """
        Compute an objective health score (0-100) based on resource load and hardware integrity.
        """
        if not self.network_connected:
            return 0.0

        cpu_penalty = max(0.0, (self.cpu_percent - 70.0) * 1.5) if self.cpu_percent > 70.0 else 0.0
        ram_penalty = max(0.0, (self.ram_percent - 75.0) * 1.4) if self.ram_percent > 75.0 else 0.0
        disk_usage_penalty = max(0.0, (self.disk_percent - 85.0) * 1.2) if self.disk_percent > 85.0 else 0.0
        disk_health_penalty = (100.0 - self.disk_health) * 0.8
        hardware_penalty = 30.0 if self.hardware_fault else 0.0

        total_penalty = cpu_penalty + ram_penalty + disk_usage_penalty + disk_health_penalty + hardware_penalty
        score = max(0.0, min(100.0, 100.0 - total_penalty))
        return round(score, 1)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "computer_id": self.computer_id,
            "name": self.name,
            "os_name": self.os_name,
            "os_version": self.os_version,
            "cpu_model": self.cpu_model,
            "cpu_cores": self.cpu_cores,
            "ram_capacity_gb": self.ram_capacity_gb,
            "storage_capacity_gb": self.storage_capacity_gb,
            "ip_address": self.ip_address,
            "mac_address": self.mac_address,
            "status": self.status,
            "health_score": self.health_score,
            "cpu_percent": self.cpu_percent,
            "ram_percent": self.ram_percent,
            "disk_percent": self.disk_percent,
            "disk_health": self.disk_health,
            "network_rx_kbps": self.network_rx_kbps,
            "network_tx_kbps": self.network_tx_kbps,
            "uptime_seconds": self.uptime_seconds,
            "active_user": self.active_user,
            "login_time": self.login_time.isoformat() if self.login_time else None,
            "session_duration_seconds": self.session_duration_seconds,
            "last_heartbeat": self.last_heartbeat.isoformat(),
            "network_connected": self.network_connected,
            "hardware_fault": self.hardware_fault,
            "processes_count": len(self.processes),
            "processes": [p.to_dict() for p in self.processes]
        }
