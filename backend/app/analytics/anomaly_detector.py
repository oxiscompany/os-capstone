"""
Rule-Based Anomaly Detection Engine for LabNexus.
Features alert deduplication, threshold checks, debouncing, and automatic resolution/recovery.
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from backend.app.config import settings

class AnomalyDetector:
    def __init__(self):
        # Configurable thresholds
        self.cpu_warning = settings.CPU_WARNING_THRESHOLD
        self.cpu_critical = settings.CPU_CRITICAL_THRESHOLD
        self.ram_warning = settings.RAM_WARNING_THRESHOLD
        self.ram_critical = settings.RAM_CRITICAL_THRESHOLD
        self.disk_warning = settings.DISK_WARNING_THRESHOLD
        self.disk_health_critical = settings.DISK_HEALTH_CRITICAL_THRESHOLD
        
        # State tracking for deduplication: key -> (severity, alert_dict)
        self.active_alerts: Dict[str, Dict[str, Any]] = {}
        self.alert_history: List[Dict[str, Any]] = []
        self._next_alert_id: int = 1

    def _make_key(self, computer_id: str, alert_type: str) -> str:
        return f"{computer_id}:{alert_type}"

    def evaluate_computer(self, comp_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Evaluate a single computer's latest metrics. Returns newly triggered alerts or recovery events.
        """
        computer_id = comp_dict["computer_id"]
        generated_events: List[Dict[str, Any]] = []

        cpu = comp_dict.get("cpu_percent", 0.0)
        ram = comp_dict.get("ram_percent", 0.0)
        disk_pct = comp_dict.get("disk_percent", 0.0)
        disk_hlth = comp_dict.get("disk_health", 100.0)
        is_net_connected = comp_dict.get("network_connected", True)
        status = comp_dict.get("status", "online")
        processes = comp_dict.get("processes", [])

        # 1. CPU Checks
        cpu_key = self._make_key(computer_id, "CPU")
        if cpu >= self.cpu_critical:
            self._trigger_or_escalate(cpu_key, computer_id, "CPU_CRITICAL", "critical",
                                      "Critical CPU Utilization",
                                      f"CPU usage reached {cpu}% (Threshold: {self.cpu_critical}%).",
                                      "cpu_percent", cpu, self.cpu_critical, generated_events)
        elif cpu >= self.cpu_warning:
            self._trigger_or_escalate(cpu_key, computer_id, "CPU_WARNING", "warning",
                                      "Elevated CPU Utilization",
                                      f"CPU usage is at {cpu}% (Threshold: {self.cpu_warning}%).",
                                      "cpu_percent", cpu, self.cpu_warning, generated_events)
        else:
            self._auto_resolve_if_active(cpu_key, computer_id, "CPU_RECOVERY",
                                         f"CPU utilization normalized to {cpu}%.", generated_events)

        # 2. RAM Checks
        ram_key = self._make_key(computer_id, "RAM")
        if ram >= self.ram_critical:
            self._trigger_or_escalate(ram_key, computer_id, "RAM_CRITICAL", "critical",
                                      "Critical Memory Pressure",
                                      f"RAM usage reached {ram}% (Threshold: {self.ram_critical}%).",
                                      "ram_percent", ram, self.ram_critical, generated_events)
        elif ram >= self.ram_warning:
            self._trigger_or_escalate(ram_key, computer_id, "RAM_WARNING", "warning",
                                      "High Memory Usage",
                                      f"RAM usage is at {ram}% (Threshold: {self.ram_warning}%).",
                                      "ram_percent", ram, self.ram_warning, generated_events)
        else:
            self._auto_resolve_if_active(ram_key, computer_id, "RAM_RECOVERY",
                                         f"RAM usage normalized to {ram}%.", generated_events)

        # 3. Disk Usage Check
        disk_key = self._make_key(computer_id, "DISK_USAGE")
        if disk_pct >= self.disk_warning:
            self._trigger_or_escalate(disk_key, computer_id, "DISK_WARNING", "warning",
                                      "High Disk Space Consumption",
                                      f"Storage utilization is at {disk_pct}% (Threshold: {self.disk_warning}%).",
                                      "disk_percent", disk_pct, self.disk_warning, generated_events)
        else:
            self._auto_resolve_if_active(disk_key, computer_id, "DISK_USAGE_RECOVERY",
                                         f"Disk usage normalized to {disk_pct}%.", generated_events)

        # 4. Disk Health Check
        disk_health_key = self._make_key(computer_id, "DISK_HEALTH")
        if disk_hlth <= self.disk_health_critical:
            self._trigger_or_escalate(disk_health_key, computer_id, "DISK_HEALTH_CRITICAL", "critical",
                                      "Imminent Storage Failure",
                                      f"SMART disk health degraded to {disk_hlth}% (Critical: <= {self.disk_health_critical}%).",
                                      "disk_health", disk_hlth, self.disk_health_critical, generated_events)
        else:
            self._auto_resolve_if_active(disk_health_key, computer_id, "DISK_HEALTH_RECOVERY",
                                         f"Disk health normalized to {disk_hlth}%.", generated_events)

        # 5. Network / Heartbeat Offline Check
        offline_key = self._make_key(computer_id, "OFFLINE")
        if status == "offline" or not is_net_connected:
            self._trigger_or_escalate(offline_key, computer_id, "OFFLINE", "critical",
                                      "Machine Offline / Heartbeat Lost",
                                      f"No telemetry heartbeat received from {computer_id}. Network connection severed.",
                                      "heartbeat", 0.0, 1.0, generated_events)
        else:
            self._auto_resolve_if_active(offline_key, computer_id, "HEARTBEAT_RESTORED",
                                         f"Machine {computer_id} is back online and transmitting telemetry.", generated_events)

        # 6. Unauthorized Software Detection
        sec_key = self._make_key(computer_id, "UNAUTHORIZED_SOFTWARE")
        unapproved = [p for p in processes if not p.get("is_approved", True)]
        if unapproved:
            proc_names = ", ".join(p["name"] for p in unapproved)
            self._trigger_or_escalate(sec_key, computer_id, "UNAUTHORIZED_APP", "critical",
                                      "Unauthorized Software Execution",
                                      f"Unapproved application(s) detected: {proc_names}.",
                                      "security_violation", 1.0, 0.0, generated_events)
        else:
            self._auto_resolve_if_active(sec_key, computer_id, "SECURITY_CLEARED",
                                         f"No unapproved processes running on {computer_id}.", generated_events)

        return generated_events

    def _trigger_or_escalate(
        self, key: str, computer_id: str, alert_type: str, severity: str,
        title: str, message: str, metric_name: str, metric_val: float, threshold: float,
        out_events: List[Dict[str, Any]]
    ):
        existing = self.active_alerts.get(key)
        # Deduplication: if alert of same severity already active, don't spam
        if existing and existing["severity"] == severity:
            return

        alert_id = self._next_alert_id
        self._next_alert_id += 1

        alert = {
            "id": alert_id,
            "computer_id": computer_id,
            "alert_type": alert_type,
            "severity": severity,
            "title": title,
            "message": message,
            "metric_name": metric_name,
            "metric_value": metric_val,
            "threshold_value": threshold,
            "is_acknowledged": False,
            "acknowledged_at": None,
            "is_resolved": False,
            "resolved_at": None,
            "created_at": datetime.utcnow().isoformat()
        }

        self.active_alerts[key] = alert
        self.alert_history.insert(0, alert)
        if len(self.alert_history) > 500:
            self.alert_history.pop()

        out_events.append(alert)

    def _auto_resolve_if_active(self, key: str, computer_id: str, recovery_type: str, resolution_msg: str, out_events: List[Dict[str, Any]]):
        if key in self.active_alerts:
            alert = self.active_alerts.pop(key)
            alert["is_resolved"] = True
            alert["resolved_at"] = datetime.utcnow().isoformat()
            
            recovery_event = {
                "id": self._next_alert_id,
                "computer_id": computer_id,
                "alert_type": recovery_type,
                "severity": "info",
                "title": f"Auto-Resolved: {alert['title']}",
                "message": resolution_msg,
                "is_acknowledged": True,
                "is_resolved": True,
                "resolved_at": datetime.utcnow().isoformat(),
                "created_at": datetime.utcnow().isoformat()
            }
            self._next_alert_id += 1
            self.alert_history.insert(0, recovery_event)
            out_events.append(recovery_event)

    def acknowledge_alert(self, alert_id: int, user_name: str = "Admin") -> Optional[Dict[str, Any]]:
        for alert in self.alert_history:
            if alert["id"] == alert_id:
                alert["is_acknowledged"] = True
                alert["acknowledged_at"] = datetime.utcnow().isoformat()
                alert["acknowledged_by"] = user_name
                return alert
        return None

# Global anomaly detector singleton
anomaly_detector = AnomalyDetector()
