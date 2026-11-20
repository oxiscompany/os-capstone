import React, { useState, useEffect } from 'react';
import { BellRing, ShieldAlert, CheckCircle2, Filter, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { Alert } from '../api/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const AlertsPage: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [unackOnly, setUnackOnly] = useState<boolean>(false);
  const [summary, setSummary] = useState<any | null>(null);

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts({
        severity: filterSeverity !== 'all' ? filterSeverity : undefined,
        unacknowledged_only: unackOnly,
        limit: 100,
      });
      setAlerts(data);
      const s = await api.getAlertsSummary();
      setSummary(s);
    } catch {
      // background
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 2000);
    return () => clearInterval(interval);
  }, [filterSeverity, unackOnly]);

  const handleAcknowledge = async (id: number) => {
    try {
      await api.acknowledgeAlert(id, user?.username || 'Admin');
      await fetchAlerts();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Incident Alerts Centre
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              {alerts.length} Incidents
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Rule-based threshold anomalies, automatic recovery events, and administrator acknowledgement tracking.
          </p>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          {['all', 'critical', 'warning', 'info'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded capitalize transition font-medium ${
                filterSeverity === sev ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <span className="text-xs text-slate-400">Critical Incidents:</span>
          <span className="text-sm font-bold text-rose-400 font-mono">{summary?.critical_alerts || 0}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <span className="text-xs text-slate-400">Warning Incidents:</span>
          <span className="text-sm font-bold text-amber-400 font-mono">{summary?.warning_alerts || 0}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <span className="text-xs text-slate-400">Recovered Events:</span>
          <span className="text-sm font-bold text-emerald-400 font-mono">{summary?.info_alerts || 0}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <span className="text-xs text-slate-400">Pending Ack:</span>
          <span className="text-sm font-bold text-white font-mono">{summary?.unacknowledged_alerts || 0}</span>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Workstation</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Alert Title</th>
                <th className="py-3 px-4">Diagnostic Details</th>
                <th className="py-3 px-4">Lifecycle</th>
                <th className="py-3 px-4 text-right">Acknowledgement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No active or historical incident alerts found matching criteria.
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr
                    key={a.id}
                    className={`hover:bg-slate-800/40 transition ${
                      a.severity === 'critical' ? 'bg-rose-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(a.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{a.computer_id}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={a.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{a.title}</td>
                    <td className="py-3 px-4 text-slate-300 text-[11px] max-w-sm truncate">{a.message}</td>
                    <td className="py-3 px-4">
                      {a.is_resolved ? (
                        <span className="text-[10px] text-emerald-400 font-mono">RESOLVED</span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-mono animate-pulse">ACTIVE TRIGGER</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {a.is_acknowledged ? (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Ack by {a.acknowledged_by || 'Admin'}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAcknowledge(a.id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition shadow-sm"
                        >
                          Acknowledge
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
