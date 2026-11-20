import React, { useState, useEffect } from 'react';
import {
  Flame,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Cpu,
  HardDrive,
  WifiOff,
  AlertTriangle,
  History
} from 'lucide-react';
import { api } from '../api/client';
import { Scenario, ScenarioHistoryRecord } from '../api/types';
import { useSimulation } from '../context/SimulationContext';
import { StatusBadge } from '../components/common/StatusBadge';

export const ScenarioSimulationPage: React.FC = () => {
  const { computers, refreshManual } = useSimulation();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [history, setHistory] = useState<ScenarioHistoryRecord[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string>>({});
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchScenariosAndHistory = async () => {
    try {
      const scList = await api.getScenarios();
      setScenarios(scList);
      const hList = await api.getScenarioHistory(20);
      setHistory(hList);
    } catch {
      // background
    }
  };

  useEffect(() => {
    fetchScenariosAndHistory();
  }, []);

  const handleRunScenario = async (scId: string) => {
    const target = selectedTargets[scId] || 'PC-001';
    setRunningScenario(scId);
    try {
      const res = await api.runScenario(scId, target);
      setNotification(`Scenario '${res.name}' executed on ${target}.`);
      await refreshManual();
      await fetchScenariosAndHistory();
    } catch (err: any) {
      setNotification(`Error: ${err.message}`);
    } finally {
      setRunningScenario(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Scenario Simulation Centre
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Execute predefined laboratory fault scenarios to evaluate automatic anomaly detection, alert deduplication, and recovery mechanisms.
        </p>
      </div>

      {notification && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300 flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 8 Predefined Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map((sc) => {
          const isRunning = runningScenario === sc.id;
          const currentTarget = selectedTargets[sc.id] || sc.default_target;

          return (
            <div
              key={sc.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-blue-400">
                    {sc.category}
                  </span>
                  <StatusBadge status={sc.severity} size="sm" />
                </div>

                <h3 className="text-sm font-bold text-white mb-2">{sc.name}</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">{sc.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                {sc.default_target !== 'MULTI' && sc.default_target !== 'ALL' && (
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">Target Computer</label>
                    <select
                      value={currentTarget}
                      onChange={(e) =>
                        setSelectedTargets((prev) => ({ ...prev, [sc.id]: e.target.value }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                    >
                      {computers.map((c) => (
                        <option key={c.computer_id} value={c.computer_id}>
                          {c.computer_id} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={() => handleRunScenario(sc.id)}
                  disabled={isRunning}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    sc.id === 'SCENARIO_SYSTEM_RECOVERY'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                  } disabled:opacity-50`}
                >
                  {sc.id === 'SCENARIO_SYSTEM_RECOVERY' ? (
                    <RotateCcw className="w-3.5 h-3.5" />
                  ) : (
                    <Flame className="w-3.5 h-3.5" />
                  )}
                  <span>{isRunning ? 'Executing...' : 'Trigger Scenario'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scenario Execution History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              Scenario Execution Audit History
            </h3>
            <p className="text-xs text-slate-400">Chronological record of triggered faults, alerts, and system recoveries</p>
          </div>
          <button
            onClick={fetchScenariosAndHistory}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded transition"
          >
            Refresh History
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Run ID</th>
                <th className="py-2.5 px-3">Scenario Name</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Trigger Conditions</th>
                <th className="py-2.5 px-3">Start Time</th>
                <th className="py-2.5 px-3">Recovery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 italic font-sans">
                    No scenarios executed yet. Trigger any scenario above to view audit history.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 text-slate-400">#{h.id}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-white">{h.name}</td>
                    <td className="py-2.5 px-3 text-blue-400">{h.target_computer_id}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <StatusBadge status={h.execution_status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300 text-[11px] truncate max-w-xs">
                      {h.trigger_conditions || 'Manual Trigger'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {h.start_time ? new Date(h.start_time).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          h.recovery_status === 'recovered'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {h.recovery_status.toUpperCase()}
                      </span>
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
