"""
Simulation Engine for LabNexus.
Coordinates 10 independent VirtualComputer instances, controls the simulation lifecycle,
executes fault/scenario injections, handles heartbeat timeouts, and integrates with
database persistence and WebSocket broadcasting.
"""
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Callable, Any
from backend.app.simulation.virtual_pc import VirtualComputer
from backend.app.config import settings

logger = logging.getLogger("labnexus.simulation")

class SimulationEngine:
    def __init__(self):
        self.is_running: bool = False
        self.is_paused: bool = False
        self.interval_seconds: float = settings.SIMULATION_INTERVAL_SECONDS
        self.heartbeat_timeout_seconds: float = settings.HEARTBEAT_TIMEOUT_SECONDS
        self.speed_multiplier: float = 1.0
        self.mode: str = "automatic" # automatic, manual, scenario
        
        self.computers: Dict[str, VirtualComputer] = {}
        self.active_scenarios: Dict[str, Dict[str, Any]] = {}
        self.scenario_history: List[Dict[str, Any]] = []
        self.simulation_events: List[Dict[str, Any]] = []
        
        # Async background task handle
        self._loop_task: Optional[asyncio.Task] = None
        self._callbacks: List[Callable[[Dict[str, Any]], Any]] = []
        self._event_callbacks: List[Callable[[Dict[str, Any]], Any]] = []

        self.initialize_computers()

    def initialize_computers(self):
        """
        Initialize the 10 virtual computers with diverse, realistic hardware configurations.
        """
        configs = [
            {
                "id": "PC-001",
                "name": "Alpha-Workstation",
                "os_name": "Windows 11 Pro",
                "os_version": "23H2",
                "cpu_model": "Intel Core i7-13700 (16 Cores)",
                "cpu_cores": 16,
                "ram_capacity_gb": 32.0,
                "storage_capacity_gb": 1024.0,
                "ip_address": "192.168.1.101",
                "mac_address": "00:1A:2B:3C:4D:01",
                "default_user": "prof.vikram"
            },
            {
                "id": "PC-002",
                "name": "Beta-CAD-Station",
                "os_name": "Windows 11 Pro",
                "os_version": "23H2",
                "cpu_model": "AMD Ryzen 9 7900X (12 Cores)",
                "cpu_cores": 12,
                "ram_capacity_gb": 64.0,
                "storage_capacity_gb": 2048.0,
                "ip_address": "192.168.1.102",
                "mac_address": "00:1A:2B:3C:4D:02",
                "default_user": "student.ananya"
            },
            {
                "id": "PC-003",
                "name": "Gamma-DevLab",
                "os_name": "Ubuntu Linux",
                "os_version": "22.04 LTS",
                "cpu_model": "Intel Core i5-13400 (10 Cores)",
                "cpu_cores": 10,
                "ram_capacity_gb": 16.0,
                "storage_capacity_gb": 512.0,
                "ip_address": "192.168.1.103",
                "mac_address": "00:1A:2B:3C:4D:03",
                "default_user": "student.rohit"
            },
            {
                "id": "PC-004",
                "name": "Delta-DevLab",
                "os_name": "Ubuntu Linux",
                "os_version": "22.04 LTS",
                "cpu_model": "Intel Core i5-13400 (10 Cores)",
                "cpu_cores": 10,
                "ram_capacity_gb": 16.0,
                "storage_capacity_gb": 512.0,
                "ip_address": "192.168.1.104",
                "mac_address": "00:1A:2B:3C:4D:04",
                "default_user": "student.priya"
            },
            {
                "id": "PC-005",
                "name": "Epsilon-General",
                "os_name": "Windows 10 Enterprise",
                "os_version": "22H2",
                "cpu_model": "AMD Ryzen 5 5600G (6 Cores)",
                "cpu_cores": 6,
                "ram_capacity_gb": 8.0,
                "storage_capacity_gb": 256.0,
                "ip_address": "192.168.1.105",
                "mac_address": "00:1A:2B:3C:4D:05",
                "default_user": "student.kabir"
            },
            {
                "id": "PC-006",
                "name": "Zeta-General",
                "os_name": "Windows 10 Enterprise",
                "os_version": "22H2",
                "cpu_model": "AMD Ryzen 5 5600G (6 Cores)",
                "cpu_cores": 6,
                "ram_capacity_gb": 8.0,
                "storage_capacity_gb": 256.0,
                "ip_address": "192.168.1.106",
                "mac_address": "00:1A:2B:3C:4D:06",
                "default_user": None
            },
            {
                "id": "PC-007",
                "name": "Eta-DataScience",
                "os_name": "Ubuntu Linux",
                "os_version": "22.04 LTS",
                "cpu_model": "Intel Core i9-13900K (24 Cores)",
                "cpu_cores": 24,
                "ram_capacity_gb": 64.0,
                "storage_capacity_gb": 2048.0,
                "ip_address": "192.168.1.107",
                "mac_address": "00:1A:2B:3C:4D:07",
                "default_user": "research.meera"
            },
            {
                "id": "PC-008",
                "name": "Theta-Graphics",
                "os_name": "Windows 11 Pro",
                "os_version": "23H2",
                "cpu_model": "Intel Core i7-12700 (12 Cores)",
                "cpu_cores": 12,
                "ram_capacity_gb": 32.0,
                "storage_capacity_gb": 1024.0,
                "ip_address": "192.168.1.108",
                "mac_address": "00:1A:2B:3C:4D:08",
                "default_user": "student.dev"
            },
            {
                "id": "PC-009",
                "name": "Iota-StudentLab",
                "os_name": "Windows 10 Pro",
                "os_version": "22H2",
                "cpu_model": "Intel Core i3-12100 (4 Cores)",
                "cpu_cores": 4,
                "ram_capacity_gb": 8.0,
                "storage_capacity_gb": 256.0,
                "ip_address": "192.168.1.109",
                "mac_address": "00:1A:2B:3C:4D:09",
                "default_user": "student.tanya"
            },
            {
                "id": "PC-010",
                "name": "Kappa-StudentLab",
                "os_name": "Windows 10 Pro",
                "os_version": "22H2",
                "cpu_model": "Intel Core i3-12100 (4 Cores)",
                "cpu_cores": 4,
                "ram_capacity_gb": 8.0,
                "storage_capacity_gb": 256.0,
                "ip_address": "192.168.1.110",
                "mac_address": "00:1A:2B:3C:4D:10",
                "default_user": None
            }
        ]

        self.computers = {}
        for cfg in configs:
            pc = VirtualComputer(
                computer_id=cfg["id"],
                name=cfg["name"],
                os_name=cfg["os_name"],
                os_version=cfg["os_version"],
                cpu_model=cfg["cpu_model"],
                cpu_cores=cfg["cpu_cores"],
                ram_capacity_gb=cfg["ram_capacity_gb"],
                storage_capacity_gb=cfg["storage_capacity_gb"],
                ip_address=cfg["ip_address"],
                mac_address=cfg["mac_address"],
                default_user=cfg["default_user"]
            )
            self.computers[cfg["id"]] = pc

    def register_telemetry_callback(self, callback: Callable[[Dict[str, Any]], Any]):
        self._callbacks.append(callback)

    def register_event_callback(self, callback: Callable[[Dict[str, Any]], Any]):
        self._event_callbacks.append(callback)

    def record_event(self, event_type: str, details: str, computer_id: str, scenario_id: Optional[str] = None):
        event = {
            "id": len(self.simulation_events) + 1,
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "details": details,
            "computer_id": computer_id,
            "scenario_id": scenario_id
        }
        self.simulation_events.insert(0, event)
        # Keep recent 200 events in memory
        if len(self.simulation_events) > 200:
            self.simulation_events.pop()

        for cb in self._event_callbacks:
            try:
                cb(event)
            except Exception as e:
                logger.error(f"Event callback error: {e}")

    async def start(self):
        """Start the background simulation loop"""
        if self.is_running:
            return {"status": "already_running"}

        self.is_running = True
        self.is_paused = False
        self._loop_task = asyncio.create_task(self._simulation_loop())
        self.record_event("SIMULATION_STARTED", "Simulation engine started.", "GLOBAL")
        logger.info("Simulation engine started.")
        return {"status": "started"}

    def pause(self):
        """Pause ticks"""
        self.is_paused = True
        self.record_event("SIMULATION_PAUSED", "Simulation ticks paused.", "GLOBAL")
        return {"status": "paused"}

    def resume(self):
        """Resume ticks"""
        self.is_paused = False
        self.record_event("SIMULATION_RESUMED", "Simulation ticks resumed.", "GLOBAL")
        return {"status": "resumed"}

    async def stop(self):
        """Stop the background simulation loop and clean up background tasks"""
        self.is_running = False
        self.is_paused = False
        if self._loop_task and not self._loop_task.done():
            self._loop_task.cancel()
            try:
                await self._loop_task
            except asyncio.CancelledError:
                pass
        self.record_event("SIMULATION_STOPPED", "Simulation engine stopped.", "GLOBAL")
        logger.info("Simulation engine stopped.")
        return {"status": "stopped"}

    def reset(self):
        """Reset all virtual computers to clean default states"""
        self.initialize_computers()
        self.active_scenarios.clear()
        self.record_event("SIMULATION_RESET", "All 10 virtual computers reset to default states.", "GLOBAL")
        return {"status": "reset"}

    def get_computer(self, computer_id: str) -> Optional[VirtualComputer]:
        return self.computers.get(computer_id)

    def tick_all(self):
        """Execute one simulation cycle across all 10 virtual computers"""
        now = datetime.utcnow()
        effective_interval = self.interval_seconds / max(0.1, self.speed_multiplier)

        for pc in self.computers.values():
            # Check for heartbeat expiry (e.g. if network disconnected)
            if pc.network_connected and pc.is_powered_on:
                pc.tick(interval_seconds=effective_interval)
            else:
                # Still increment elapsed time
                elapsed_heartbeat = (now - pc.last_heartbeat).total_seconds()
                if elapsed_heartbeat > self.heartbeat_timeout_seconds:
                    pc.status = "offline"
                    pc.health_score = 0.0
                    pc.network_rx_kbps = 0.0
                    pc.network_tx_kbps = 0.0
                    pc.cpu_percent = 0.0
                    pc.ram_percent = 0.0

    async def _simulation_loop(self):
        """Main async simulation loop"""
        try:
            while self.is_running:
                if not self.is_paused:
                    self.tick_all()
                    snapshot = self.get_telemetry_snapshot()
                    for cb in self._callbacks:
                        try:
                            res = cb(snapshot)
                            if asyncio.iscoroutine(res):
                                await res
                        except Exception as e:
                            logger.error(f"Error in telemetry callback: {e}")

                sleep_duration = self.interval_seconds / max(0.1, self.speed_multiplier)
                await asyncio.sleep(sleep_duration)
        except asyncio.CancelledError:
            pass

    def get_telemetry_snapshot(self) -> Dict[str, Any]:
        """Generate full snapshot for monitoring and WebSocket broadcasts"""
        computers_data = [pc.to_dict() for pc in self.computers.values()]
        
        # Summary calculations
        online_count = sum(1 for c in computers_data if c["status"] == "online")
        offline_count = sum(1 for c in computers_data if c["status"] == "offline")
        warning_count = sum(1 for c in computers_data if c["status"] == "warning")
        critical_count = sum(1 for c in computers_data if c["status"] == "critical")
        
        avg_cpu = round(sum(c["cpu_percent"] for c in computers_data) / max(1, len(computers_data)), 1)
        avg_ram = round(sum(c["ram_percent"] for c in computers_data) / max(1, len(computers_data)), 1)
        avg_health = round(sum(c["health_score"] for c in computers_data) / max(1, len(computers_data)), 1)

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "simulation_state": {
                "is_running": self.is_running,
                "is_paused": self.is_paused,
                "speed_multiplier": self.speed_multiplier,
                "interval_seconds": self.interval_seconds,
                "mode": self.mode
            },
            "summary": {
                "total_computers": len(computers_data),
                "online_computers": online_count,
                "offline_computers": offline_count,
                "warning_computers": warning_count,
                "critical_computers": critical_count,
                "avg_cpu_percent": avg_cpu,
                "avg_ram_percent": avg_ram,
                "avg_health_score": avg_health
            },
            "computers": computers_data
        }

    # ==================== SCENARIO ENGINE ====================

    def run_scenario(self, scenario_id: str, target_pc_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Execute predefined fault injection scenarios as specified in Section 6.
        """
        target_id = target_pc_id or "PC-001"
        target_pc = self.computers.get(target_id)
        if not target_pc and scenario_id != "SCENARIO_MULTIPLE_FAILURES":
            return {"error": f"Target computer {target_id} not found."}

        scenario_name = ""
        description = ""
        trigger_conditions = ""

        if scenario_id == "SCENARIO_CPU_OVERLOAD":
            scenario_name = "CPU Overload Injection"
            description = f"Sets {target_id} CPU utilization to 98% to simulate heavy compute or run-away process."
            trigger_conditions = "CPU >= 95% -> Critical Alert Triggered"
            target_pc.manual_cpu_override = 98.0
            target_pc.add_process("StressTest64.exe", base_cpu=85.0, base_ram_mb=450.0)
            self.record_event("SCENARIO_TRIGGERED", f"CPU overload injected on {target_id} (CPU 98%).", target_id, scenario_id)

        elif scenario_id == "SCENARIO_MEMORY_OVERLOAD":
            scenario_name = "Memory Leak / Overload"
            description = f"Simulates aggressive memory leak on {target_id}, consuming 95% of available RAM."
            trigger_conditions = "RAM >= 95% -> Critical Memory Alert Triggered"
            target_pc.manual_ram_override = 95.0
            target_pc.add_process("MemoryLeakSimulator.exe", base_cpu=12.0, base_ram_mb=float(target_pc.ram_capacity_gb * 1024 * 0.8))
            self.record_event("SCENARIO_TRIGGERED", f"Memory overload injected on {target_id} (RAM 95%).", target_id, scenario_id)

        elif scenario_id == "SCENARIO_NETWORK_FAILURE":
            scenario_name = "Network Cable Disconnection"
            description = f"Disconnects Ethernet interface on {target_id}, halting heartbeats and causing timeout offline detection."
            trigger_conditions = "Heartbeat timeout (>6s) -> Machine Offline Alert"
            target_pc.network_connected = False
            self.record_event("SCENARIO_TRIGGERED", f"Network link disconnected on {target_id}.", target_id, scenario_id)

        elif scenario_id == "SCENARIO_DISK_FAILURE":
            scenario_name = "Hardware Storage Degradation"
            description = f"Simulates SMART hardware failure and bad sector degradation on {target_id} storage."
            trigger_conditions = "Disk Health <= 20% -> Hardware Fault Alert"
            target_pc.trigger_hardware_fault()
            self.record_event("SCENARIO_TRIGGERED", f"Disk hardware fault injected on {target_id} (Health 15%).", target_id, scenario_id)

        elif scenario_id == "SCENARIO_IDLE_COMPUTER":
            scenario_name = "Prolonged Inactivity Detection"
            description = f"Clears workload and active sessions on {target_id} to test power-saving and idle tracking."
            trigger_conditions = "CPU < 5%, No Active User for extended period"
            target_pc.simulate_logout()
            target_pc.manual_cpu_override = 2.5
            target_pc.manual_ram_override = 14.0
            self.record_event("SCENARIO_TRIGGERED", f"{target_id} placed into idle inactivity state.", target_id, scenario_id)

        elif scenario_id == "SCENARIO_UNAUTHORIZED_SOFTWARE":
            scenario_name = "Unauthorized Software Installation"
            description = f"Spawns unapproved crypto miner / p2p torrent executable on {target_id}."
            trigger_conditions = "Unapproved process detected -> Security Threat Alert"
            target_pc.add_process("CryptoMiner_XMRig.exe", base_cpu=68.0, base_ram_mb=980.0, is_approved=False)
            self.record_event("SCENARIO_TRIGGERED", f"Unauthorized app 'CryptoMiner_XMRig.exe' launched on {target_id}.", target_id, scenario_id)

        elif scenario_id == "SCENARIO_MULTIPLE_FAILURES":
            scenario_name = "Cascading Multi-System Failure"
            description = "Simulates lab-wide disruptions: PC-001 CPU spike, PC-003 memory leak, PC-005 network cut."
            trigger_conditions = "Simultaneous critical states across multiple systems"
            p1 = self.computers.get("PC-001")
            p3 = self.computers.get("PC-003")
            p5 = self.computers.get("PC-005")
            if p1: p1.manual_cpu_override = 97.0
            if p3: p3.manual_ram_override = 96.0
            if p5: p5.network_connected = False
            self.record_event("SCENARIO_TRIGGERED", "Multiple simultaneous system failures injected across PC-001, PC-003, PC-005.", "MULTI", scenario_id)

        elif scenario_id == "SCENARIO_SYSTEM_RECOVERY":
            scenario_name = "Complete System Recovery"
            description = f"Restores all fault overrides and re-establishes connectivity on {target_id} (or all systems)."
            trigger_conditions = "System health normalized, network restored"
            if target_pc:
                target_pc.restore_health()
                self.record_event("SCENARIO_RECOVERY", f"System restored and normalized on {target_id}.", target_id, scenario_id)
            else:
                for pc in self.computers.values():
                    pc.restore_health()
                self.record_event("SCENARIO_RECOVERY", "All lab computers restored to normal operational state.", "ALL", scenario_id)

        else:
            return {"error": f"Unknown scenario_id: {scenario_id}"}

        scenario_record = {
            "id": len(self.scenario_history) + 1,
            "scenario_id": scenario_id,
            "name": scenario_name,
            "description": description,
            "target_computer_id": target_id,
            "trigger_conditions": trigger_conditions,
            "execution_status": "running" if scenario_id != "SCENARIO_SYSTEM_RECOVERY" else "recovered",
            "start_time": datetime.utcnow().isoformat(),
            "end_time": datetime.utcnow().isoformat() if scenario_id == "SCENARIO_SYSTEM_RECOVERY" else None,
            "recovery_status": "recovered" if scenario_id == "SCENARIO_SYSTEM_RECOVERY" else "in_progress"
        }
        self.active_scenarios[scenario_id] = scenario_record
        self.scenario_history.insert(0, scenario_record)
        return scenario_record

# Global singleton simulation engine instance
simulation_engine = SimulationEngine()
