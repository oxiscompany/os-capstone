import React from 'react';
import { Link } from 'react-router-dom';
import {
  Monitor,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cpu,
  HardDrive,
  Activity,
  HeartPulse,
  Flame,
  ArrowRight,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { HealthBar } from '../components/common/HealthBar';
import { HealthDonutChart } from '../components/charts/HealthDonutChart';
import { BarComparisonChart } from '../components/charts/BarComparisonChart';

export const DashboardPage: React.FC = () => {
  const { snapshot, computers, isSimulating, isPaused, startSimulation, pauseSimulation, resumeSimulation, resetSimulation, recentAlerts } = useSimulation();

  const summary = snapshot?.summary || {
    total_computers: 10,
    online_computers: 10,
    offline_computers: 0,
    warning_computers: 0,
    critical_computers: 0,
    avg_cpu_percent: 22.5,
    avg_ram_percent: 34.0,
    avg_health_score: 95.0,
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Simulation Control Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/30 via-slate-900 to-slate-900 border border-slate-800 rounded-xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Main Laboratory Overview
            <span className="text-xs bg-blue-500/20 text-blue-400 font-normal px-2 py-0.5 rounded-full border border-blue-500/30">
              Lab A (10 Workstations)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry stream from 10 independent virtual computer instances.
          </p>
        </div>

        {/* Global Simulation Actions */}
        <div className="flex items-center gap-2">
          {(!isSimulating || isPaused) ? (
            <button
              onClick={isPaused ? resumeSimulation : startSimulation}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPaused ? 'Resume Simulation' : 'Start Simulation'}</span>
            </button>
          ) : (
            <button
              onClick={pauseSimulation}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause Ticks</span>
            </button>
          )}

          <button
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <Link
            to="/scenarios"
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium rounded-lg border border-blue-500/30 transition"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Inject Fault</span>
          </Link>
        </div>
      </div>

      {/* 8 Primary KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <MetricCard
          title="Total Workstations"
          value={summary.total_computers}
          icon={Monitor}
          color="blue"
        />
        <MetricCard
          title="Online"
          value={summary.online_computers}
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="Warnings"
          value={summary.warning_computers}
          icon={AlertTriangle}
          color="amber"
        />
        <MetricCard
          title="Critical"
          value={summary.critical_computers}
          icon={XCircle}
          color="rose"
        />
        <MetricCard
          title="Offline"
          value={summary.offline_computers}
          icon={Activity}
          color="slate"
        />
        <MetricCard
          title="Avg CPU Load"
          value={`${summary.avg_cpu_percent}%`}
          icon={Cpu}
          color="blue"
        />
        <MetricCard
          title="Avg RAM Load"
          value={`${summary.avg_ram_percent}%`}
          icon={HardDrive}
          color="blue"
        />
        <MetricCard
          title="Lab Health Score"
          value={`${summary.avg_health_score}%`}
          icon={HeartPulse}
          color={summary.avg_health_score >= 75 ? 'emerald' : summary.avg_health_score >= 40 ? 'amber' : 'rose'}
        />
      </div>

      {/* Charts Section: Workstation Resource Distribution & Health Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Live Resource Utilization Comparison</h3>
              <p className="text-xs text-slate-400">Independent CPU, RAM, and Disk metrics across all 10 virtual computers</p>
            </div>
            <Link to="/monitoring" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium">
              View Matrix <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <BarComparisonChart computers={computers} />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Laboratory Health Distribution</h3>
            <p className="text-xs text-slate-400">Operational status breakdown</p>
            <HealthDonutChart
              online={summary.online_computers}
              warning={summary.warning_computers}
              critical={summary.critical_computers}
              offline={summary.offline_computers}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Online: {summary.online_computers}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-300">Warning: {summary.warning_computers}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-300">Critical: {summary.critical_computers}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span className="text-slate-300">Offline: {summary.offline_computers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: All 10 Virtual Computers Live Table & Recent Anomaly Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table of 10 Computers */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Virtual Computers Status (10 Nodes)</h3>
              <p className="text-xs text-slate-400">Real-time health, active user sessions, and hardware telemetry</p>
            </div>
            <Link to="/simulation-control" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium">
              Simulation Control <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Workstation</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">CPU</th>
                  <th className="py-2.5 px-3">RAM</th>
                  <th className="py-2.5 px-3">Storage</th>
                  <th className="py-2.5 px-3">Health</th>
                  <th className="py-2.5 px-3">Active User</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {computers.map((comp) => (
                  <tr key={comp.computer_id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white font-sans">{comp.computer_id}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{comp.name}</div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={comp.status} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <span className={comp.cpu_percent >= 90 ? 'text-rose-400 font-bold' : comp.cpu_percent >= 80 ? 'text-amber-400' : 'text-slate-300'}>
                        {comp.cpu_percent}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={comp.ram_percent >= 90 ? 'text-rose-400 font-bold' : comp.ram_percent >= 85 ? 'text-amber-400' : 'text-slate-300'}>
                        {comp.ram_percent}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {comp.disk_percent}%
                    </td>
                    <td className="py-3 px-3 w-28">
                      <HealthBar value={comp.health_score} size="sm" />
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300">
                      {comp.active_user ? (
                        <span className="text-blue-400 font-medium">{comp.active_user}</span>
                      ) : (
                        <span className="text-slate-500 italic">Idle</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/computers/${comp.computer_id}`}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 rounded text-xs transition inline-block font-sans font-medium"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Alerts Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Live Anomaly Stream
                </h3>
                <p className="text-xs text-slate-400">Rule-based alerts & auto-recoveries</p>
              </div>
              <Link to="/alerts" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                All Alerts
              </Link>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
              {recentAlerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  No active anomaly alerts. All systems operating within thresholds.
                </div>
              ) : (
                recentAlerts.slice(0, 7).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border text-xs transition ${
                      alert.severity === 'critical'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : alert.severity === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono bg-black/40 px-1 py-0.2 rounded text-[10px]">
                          {alert.computer_id}
                        </span>
                        {alert.title}
                      </span>
                      <span className="text-[10px] opacity-75 font-mono">
                        {alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 opacity-90">{alert.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Deduplication & auto-recovery active</span>
            <Link to="/settings" className="text-blue-400 hover:underline">
              Adjust Thresholds
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
