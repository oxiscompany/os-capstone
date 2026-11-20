"""
Computer Health Scoring System for LabNexus.
Calculates individual and aggregate health scores and category sub-scores.
"""
from typing import Dict, Any

class HealthScorer:
    @staticmethod
    def calculate_sub_scores(comp: Dict[str, Any]) -> Dict[str, float]:
        cpu = comp.get("cpu_percent", 0.0)
        ram = comp.get("ram_percent", 0.0)
        disk_pct = comp.get("disk_percent", 0.0)
        disk_hlth = comp.get("disk_health", 100.0)
        is_net = comp.get("network_connected", True)
        status = comp.get("status", "online")

        if not is_net or status == "offline":
            return {
                "cpu_score": 0.0,
                "ram_score": 0.0,
                "disk_score": 0.0,
                "network_score": 0.0,
                "overall_score": 0.0
            }

        # Sub-scores scale 0 - 100
        cpu_score = round(max(0.0, 100.0 - (max(0.0, cpu - 50.0) * 2.0)), 1)
        ram_score = round(max(0.0, 100.0 - (max(0.0, ram - 60.0) * 2.5)), 1)
        
        disk_capacity_score = max(0.0, 100.0 - (max(0.0, disk_pct - 70.0) * 3.3))
        disk_score = round(0.4 * disk_capacity_score + 0.6 * disk_hlth, 1)
        
        network_score = 100.0 if is_net else 0.0

        # Weighted aggregate: CPU (25%), RAM (25%), Disk (35%), Network (15%)
        overall = round(
            (0.25 * cpu_score) +
            (0.25 * ram_score) +
            (0.35 * disk_score) +
            (0.15 * network_score),
            1
        )

        return {
            "cpu_score": cpu_score,
            "ram_score": ram_score,
            "disk_score": disk_score,
            "network_score": network_score,
            "overall_score": overall
        }
