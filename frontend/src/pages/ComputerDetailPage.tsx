import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  User,
  Clock,
  ShieldAlert,
  Play,
  RotateCcw,
  Sliders,
  TerminalSquare,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Plus
} from 'lucide-react';
import { api } from '../api/client';
import { Computer, MetricDataPoint, SimulatedProcess } from '../api/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { HealthBar } from '../components/common/HealthBar';
import { LiveLineChart } from '../components/charts/LiveLineChart';

export const ComputerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [computer, setComputer] = useState<any | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<MetricDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Manual Overrides State
  const [overrideCpu, setOverrideCpu] = useState<number>(50);
  const [overrideRam, setOverrideRam] = useState<number>(50);
  const [newAppName, setNewAppName] = useState<string>('DataSimulator.exe');

  const fetchDetail = async () => {
    if (!id) return;
    try {
      const data = await api.getComputerDetail(id);
      setComputer(data);
      const history = await api.getMetricsHistory(id, 25);
      setMetricsHistory(history);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch computer diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    const interval = setInterval(fetchDetail, 2000);
    return () => clearInterval(interval);
  }, [id]);

  const handleApplyCpu = async () => {
    if (!id) return;
    await api.simulateComputer(id, { cpu_override: overrideCpu });
    await fetchDetail();
  };

  const handleApplyRam = async () => {
    if (!id) return;
    await api.simulateComputer(id, { ram_override: overrideRam });
    await fetchDetail();
  };

  const handleDegradeDisk = async () => {
    if (!id) return;
    await api.simulateComputer(id, { disk_health_override: 15.0 });
    await fetchDetail();
  };

  const handleToggleNetwork = async () => {
    if (!id || !computer) return;
    if (computer.network_connected) {
      await api.disconnectNetwork(id);
    } else {
      await api.reconnectNetwork(id);
    }
    await fetchDetail();
  };

  const handleRecover = async () => {
    if (!id) return;
    await api.recoverComputer(id);
    await fetchDetail();
  };

  const handleStartProcess = async (isApproved: boolean = true) => {
    if (!id) return;
    await api.startProcess(id, {
      name: newAppName,
      base_cpu: 25.0,
      base_ram_mb: 500.0,
      is_approved: isApproved,
    });
    setNewAppName('');
    await fetchDetail();
  };

  const handleStopProcess = async (pid: number) => {
    if (!id) return;
    await api.stopProcess(id, pid);
    await fetchDetail();
  };

  if (loading && !computer) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading diagnostic telemetry for {id}...
      </div>
    );
  }

  if (error || !computer) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-6 text-center text-rose-400">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <h3 className="font-semibold">{error || 'Computer not found'}</h3>
        <Link to="/monitoring" className="mt-4 inline-block text-xs text-blue-400 hover:underline">
          Return to Live Monitoring
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/monitoring"
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-mono">{computer.computer_id}</h2>
              <StatusBadge status={computer.status} />
              {computer.hardware_fault && (
                <span className="text-[10px] bg-rose-500/20 text-rose-400 font-mono px-2 py-0.5 rounded border border-rose-500/30">
                  HARDWARE FAULT
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-sans">
              {computer.name} • {computer.os_name} {computer.os_version}
            </p>
          </div>
        </div>

        {/* Top Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleNetwork}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              computer.network_connected
                ? 'bg-slate-900 text-slate-300 border-slate-700 hover:text-rose-400'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            {computer.network_connected ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{computer.network_connected ? 'Pull Network Cable' : 'Reconnect Link'}</span>
          </button>

          <button
            onClick={handleRecover}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Health</span>
          </button>
        </div>
      </div>

      {/* Specifications & Live Health Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:col-span-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Processor</span>
              <span className="font-semibold text-white">{computer.cpu_model}</span>
              <span className="text-[10px] text-slate-400 block font-mono">{computer.cpu_cores} Logical Cores</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Installed RAM</span>
              <span className="font-semibold text-white">{computer.ram_capacity_gb} GB</span>
              <span className="text-[10px] text-slate-400 block font-mono">DDR5 High-Speed</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Primary Storage</span>
              <span className="font-semibold text-white">{computer.storage_capacity_gb} GB</span>
              <span className="text-[10px] text-slate-400 block font-mono">NVMe PCIe 4.0 SSD</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Network Identity</span>
              <span className="font-mono text-white text-[11px]">{computer.ip_address}</span>
              <span className="text-[10px] text-slate-400 block font-mono">{computer.mac_address}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Composite Health</span>
            <HealthBar value={computer.health_score} size="md" />
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
            <span>Uptime: {Math.floor(computer.uptime_seconds / 3600)}h {Math.floor((computer.uptime_seconds % 3600) / 60)}m</span>
            <span>User: {computer.active_user || 'None'}</span>
          </div>
        </div>
      </div>

      {/* 4 Real-time Diagnostic Line Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CPU Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" /> CPU Utilization Over Time
            </span>
            <span className="text-xs font-mono font-bold text-blue-400">{computer.cpu_percent}%</span>
          </div>
          <LiveLineChart
            data={metricsHistory}
            metricKey="cpu_percent"
            color="#3b82f6"
            name="CPU Utilization"
          />
        </div>

        {/* RAM Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" /> RAM Pressure Over Time
            </span>
            <span className="text-xs font-mono font-bold text-purple-400">{computer.ram_percent}%</span>
          </div>
          <LiveLineChart
            data={metricsHistory}
            metricKey="ram_percent"
            color="#8b5cf6"
            name="RAM Utilization"
          />
        </div>

        {/* Storage Health & Usage Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" /> Storage Capacity Usage
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">{computer.disk_percent}%</span>
          </div>
          <LiveLineChart
            data={metricsHistory}
            metricKey="disk_percent"
            color="#06b6d4"
            name="Disk Usage"
          />
        </div>

        {/* Network RX/TX Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Network Download (RX) Bandwidth
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">{computer.network_rx_kbps} KB/s</span>
          </div>
          <LiveLineChart
            data={metricsHistory}
            metricKey="network_rx_kbps"
            color="#10b981"
            name="RX Download"
            unit=" KB/s"
            domain={[0, 1500]}
          />
        </div>
      </div>

      {/* Interactive Manual Fault Injection Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-blue-400" />
          Interactive Diagnostics & Fault Injection
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Override metrics on this specific virtual computer to test anomaly alerts and threshold triggers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Inject CPU Override */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <label className="text-xs text-slate-300 font-medium block mb-2">
              Inject CPU Spike: <span className="text-blue-400 font-mono font-bold">{overrideCpu}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={overrideCpu}
              onChange={(e) => setOverrideCpu(Number(e.target.value))}
              className="w-full accent-blue-500 mb-3"
            />
            <button
              onClick={handleApplyCpu}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition"
            >
              Apply CPU Override
            </button>
          </div>

          {/* Inject RAM Override */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <label className="text-xs text-slate-300 font-medium block mb-2">
              Inject Memory Leak: <span className="text-purple-400 font-mono font-bold">{overrideRam}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={overrideRam}
              onChange={(e) => setOverrideRam(Number(e.target.value))}
              className="w-full accent-purple-500 mb-3"
            />
            <button
              onClick={handleApplyRam}
              className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium transition"
            >
              Apply RAM Override
            </button>
          </div>

          {/* Inject Hardware Fault */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-300 font-medium block mb-1">Hardware Failure</span>
              <p className="text-[11px] text-slate-400 mb-3">
                Forces SMART disk degradation (15% health) and trips critical hardware warnings.
              </p>
            </div>
            <button
              onClick={handleDegradeDisk}
              className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-medium transition"
            >
              Trigger Disk Fault
            </button>
          </div>
        </div>
      </div>

      {/* Running Processes Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TerminalSquare className="w-4 h-4 text-emerald-400" />
              Running Processes ({computer.processes?.length || 0})
            </h3>
            <p className="text-xs text-slate-400">Independent processes executing on this virtual instance</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. StressTest.exe"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 w-44 font-mono"
            />
            <button
              onClick={() => handleStartProcess(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Launch App</span>
            </button>
            <button
              onClick={() => handleStartProcess(false)}
              className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-medium border border-rose-500/30 transition"
              title="Launch unauthorized software to test security alert"
            >
              Test Unapproved App
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-sans font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">PID</th>
                <th className="py-2.5 px-3">Process Name</th>
                <th className="py-2.5 px-3">CPU Usage</th>
                <th className="py-2.5 px-3">RAM Memory</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Approval</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {computer.processes?.map((proc: SimulatedProcess) => (
                <tr key={proc.pid} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 text-slate-400">{proc.pid}</td>
                  <td className="py-2.5 px-3 font-semibold text-white font-sans">{proc.name}</td>
                  <td className="py-2.5 px-3 text-blue-400">{proc.cpu_percent}%</td>
                  <td className="py-2.5 px-3 text-purple-400">{proc.memory_mb} MB</td>
                  <td className="py-2.5 px-3 font-sans">
                    {proc.is_system ? (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">System</span>
                    ) : (
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">User Application</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    {proc.is_approved ? (
                      <span className="text-[10px] text-emerald-400">Approved</span>
                    ) : (
                      <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold">
                        UNAUTHORIZED
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    {!proc.is_system ? (
                      <button
                        onClick={() => handleStopProcess(proc.pid)}
                        className="px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded text-xs transition"
                      >
                        End Task
                      </button>
                    ) : (
                      <span className="text-slate-600 text-xs italic">Protected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hardware Specifications & Session History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hardware Inventory Items */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-3">Hardware Inventory Registry</h3>
          <div className="space-y-2 text-xs">
            {computer.hardware_inventory?.map((hw: any) => (
              <div key={hw.id} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">{hw.brand} {hw.model}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{hw.component_type} • SN: {hw.serial_number}</span>
                </div>
                <StatusBadge status={hw.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts Log for this PC */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-3">Recent Incident Alerts</h3>
          <div className="space-y-2 text-xs">
            {computer.recent_alerts?.length === 0 ? (
              <div className="text-slate-500 italic text-center p-4">No recent incident alerts logged for this computer.</div>
            ) : (
              computer.recent_alerts?.map((al: any) => (
                <div key={al.id} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">{al.title}</span>
                    <span className="text-[10px] text-slate-400">{al.message}</span>
                  </div>
                  <StatusBadge status={al.severity} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
