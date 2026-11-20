"""
Predictive Maintenance Heuristic Prototype for LabNexus.
Analyzes telemetry trajectories, moving averages, degradation slopes, and failure warning patterns.

IMPORTANT DISCLAIMER:
This module demonstrates an algorithmic predictive maintenance prototype based on simulated
telemetry. It does not claim real-world hardware failure validation.
"""
from typing import Dict, List, Any
import numpy as np

class PredictiveMaintenancePrototype:
    def __init__(self):
        self.disclaimer: str = (
            "NOTICE: The predictive maintenance scores and failure forecasts displayed are computed "
            "using heuristic degradation models applied to simulated telemetry for academic capstone demonstration. "
            "They are distinct from deterministic threshold anomaly alerts and do not represent validated real-world physical wear."
        )

    def analyze_computer_trajectory(self, computer: Dict[str, Any], history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze recent historical metrics to assess failure risk and estimate days-to-failure.
        """
        comp_id = computer["computer_id"]
        current_disk_health = computer.get("disk_health", 100.0)
        current_cpu = computer.get("cpu_percent", 0.0)
        current_ram = computer.get("ram_percent", 0.0)
        hardware_fault = computer.get("hardware_fault", False)

        risk_factors = []
        failure_risk_score = 10.0 # Baseline low risk

        # Factor 1: Disk Health Degradation
        if current_disk_health < 50.0:
            disk_risk = (100.0 - current_disk_health) * 0.7
            failure_risk_score += disk_risk
            risk_factors.append(f"SMART storage integrity degraded to {current_disk_health}%.")
        elif current_disk_health < 80.0:
            failure_risk_score += 15.0
            risk_factors.append("Early bad sector allocation trend identified.")

        # Factor 2: Sustained Extreme Resource Load
        if current_cpu > 90.0:
            failure_risk_score += 25.0
            risk_factors.append("Severe thermal/CPU throttling stress detected (>90%).")
        elif current_cpu > 75.0:
            failure_risk_score += 10.0

        if current_ram > 90.0:
            failure_risk_score += 20.0
            risk_factors.append("Memory saturation pressure near limit (>90%).")

        # Factor 3: Hardware Fault Override
        if hardware_fault:
            failure_risk_score = max(85.0, failure_risk_score + 40.0)
            risk_factors.append("Active mechanical/electrical hardware fault registered.")

        # Slope analysis if history available
        if history and len(history) >= 5:
            disk_series = [h.get("disk_health", 100.0) for h in history[-10:]]
            if len(disk_series) >= 3:
                # Estimate negative slope
                diffs = np.diff(disk_series)
                avg_slope = float(np.mean(diffs))
                if avg_slope < -0.1:
                    failure_risk_score += 15.0
                    risk_factors.append(f"Storage degradation velocity is negative ({round(avg_slope, 2)}%/tick).")

        failure_risk_score = round(min(100.0, max(0.0, failure_risk_score)), 1)

        # Estimated Days to Maintenance Required
        if failure_risk_score >= 80.0:
            days_to_maintenance = round(max(0.5, (100.0 - failure_risk_score) / 10.0), 1)
            maintenance_urgency = "Immediate Action Required"
            recommended_action = "Schedule storage replacement, backup critical user partitions, inspect cooling fans."
        elif failure_risk_score >= 50.0:
            days_to_maintenance = round(7.0 + (80.0 - failure_risk_score) * 0.5, 1)
            maintenance_urgency = "Scheduled Maintenance"
            recommended_action = "Clean dust filtration, run full chkdsk/fsck diagnostic, monitor thermal readings."
        else:
            days_to_maintenance = round(30.0 + (50.0 - failure_risk_score) * 2.0, 1)
            maintenance_urgency = "Normal Maintenance Cycle"
            recommended_action = "System healthy. Retain standard bi-monthly inspection."

        return {
            "computer_id": comp_id,
            "computer_name": computer["name"],
            "failure_risk_score": failure_risk_score,
            "maintenance_urgency": maintenance_urgency,
            "estimated_days_to_failure": days_to_maintenance,
            "recommended_action": recommended_action,
            "risk_factors": risk_factors if risk_factors else ["All components operating within optimal tolerances."],
            "disclaimer": self.disclaimer
        }

predictive_maintenance_engine = PredictiveMaintenancePrototype()
