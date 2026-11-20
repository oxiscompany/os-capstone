import React, { useState, useEffect } from 'react';
import {
  LineChart as ChartIcon,
  ShieldAlert,
  AlertTriangle,
  Info,
  TrendingUp,
  Cpu,
  HardDrive,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/client';
import { PredictiveMaintenanceResponse } from '../api/types';
import { HealthBar } from '../components/common/HealthBar';
import { StatusBadge } from '../components/common/StatusBadge';

export const AnalyticsPage: React.FC = () => {
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [healthScores, setHealthScores] = useState<any[]>([]);
  const [predData, setPredData] = useState<PredictiveMaintenanceResponse | null>(null);

  const fetchAnalytics = async () => {
    try {
      const s = await api.getAnalyticsSummary();
      setSummaryData(s);
      const h = await api.getHealthBreakdown();
      setHealthScores(h);
      const p = await api.getPredictiveMaintenance();
      setPredData(p);
    } catch {
      // background
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Laboratory Intelligence & Quality Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Historical trend analysis, multi-dimensional health scoring, and predictive maintenance heuristic forecasting.
        </p>
      </div>

      {/* Prominent Academic Transparency Disclaimer */}
      {predData?.disclaimer && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-300 shadow-sm">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold block mb-0.5">ACADEMIC PROTOTYPE DISCLAIMER:</span>
            {predData.disclaimer}
          </div>
        </div>
      )}

      {/* Health Sub-Score Decomposition Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-2">
          Workstation Health Score Decomposition (0–100)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Deconstructed sub-scores across CPU efficiency, memory pressure, storage integrity, and network reliability.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 font-sans font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Workstation</th>
                <th className="py-2.5 px-3">CPU Score</th>
                <th className="py-2.5 px-3">RAM Score</th>
                <th className="py-2.5 px-3">Storage Score</th>
                <th className="py-2.5 px-3">Network Score</th>
                <th className="py-2.5 px-3">Composite Health</th>
                <th className="py-2.5 px-3">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {healthScores.map((h) => (
                <tr key={h.computer_id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-bold text-white font-sans">{h.computer_id}</td>
                  <td className="py-2.5 px-3 text-blue-400">{h.cpu_score}%</td>
                  <td className="py-2.5 px-3 text-purple-400">{h.ram_score}%</td>
                  <td className="py-2.5 px-3 text-cyan-400">{h.disk_score}%</td>
                  <td className="py-2.5 px-3 text-emerald-400">{h.network_score}%</td>
                  <td className="py-2.5 px-3 w-32 font-sans">
                    <HealthBar value={h.overall_score} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <StatusBadge status={h.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Predictive Maintenance Forecasts */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Predictive Maintenance Wear Forecasting Prototype
            </h3>
            <p className="text-xs text-slate-400">
              Algorithmic degradation slope analysis, failure risk scoring, and recommended intervention horizons
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              High Risk: {predData?.high_risk_computers_count || 0}
            </span>
            <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Medium: {predData?.medium_risk_computers_count || 0}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predData?.forecasts.map((f) => (
            <div
              key={f.computer_id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                f.failure_risk_score >= 80
                  ? 'bg-rose-500/5 border-rose-500/30'
                  : f.failure_risk_score >= 50
                  ? 'bg-amber-500/5 border-amber-500/30'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono font-bold text-white text-sm">{f.computer_id}</span>
                    <span className="text-xs text-slate-400 block font-sans">{f.computer_name}</span>
                  </div>
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                      f.failure_risk_score >= 80
                        ? 'bg-rose-500/20 text-rose-400'
                        : f.failure_risk_score >= 50
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    Risk Score: {f.failure_risk_score}%
                  </span>
                </div>

                <div className="text-xs mb-3">
                  <span className="text-slate-400">Maintenance Horizon: </span>
                  <span className="font-semibold text-white font-mono">
                    ~{f.estimated_days_to_failure} Days ({f.maintenance_urgency})
                  </span>
                </div>

                <div className="text-xs text-slate-300 bg-black/40 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Identified Risk Factors:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300 mt-1">
                    {f.risk_factors.map((rf, idx) => (
                      <li key={idx}>{rf}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 font-semibold">Recommended Action: </span>
                {f.recommended_action}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
