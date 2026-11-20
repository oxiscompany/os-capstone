import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  User,
  Clock,
  ShieldAlert,
  Flame,
  RotateCcw
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { HealthBar } from '../components/common/HealthBar';
import { api } from '../api/client';

export const LiveMonitoringPage: React.FC = () => {
  const { computers, refreshManual } = useSimulation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredComputers = computers.filter((c) => {
    const matchesSearch =
      c.computer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.os_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.active_user && c.active_user.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || c.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleDisconnect = async (id: string) => {
    setActionLoading(id);
    try {
      await api.disconnectNetwork(id);
      await refreshManual();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReconnect = async (id: string) => {
    setActionLoading(id);
    try {
      await api.reconnectNetwork(id);
      await refreshManual();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecover = async (id: string) => {
    setActionLoading(id);
    try {
      await api.recoverComputer(id);
      await refreshManual();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Live Computer Monitoring
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              {filteredComputers.length} of {computers.length} Workstations
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, hardware metrics, running processes, and fault injection triggers.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, name, OS, user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 w-56 sm:w-64"
            />
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            {['all', 'online', 'warning', 'critical', 'offline'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded capitalize transition font-medium ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Workstation Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {filteredComputers.map((comp) => {
          const isLoading = actionLoading === comp.computer_id;

          return (
            <div
              key={comp.computer_id}
              className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between transition shadow-sm hover:shadow-md ${
                comp.status === 'critical'
                  ? 'border-rose-500/50 shadow-rose-950/20'
                  : comp.status === 'warning'
                  ? 'border-amber-500/40 shadow-amber-950/20'
                  : comp.status === 'offline'
                  ? 'border-slate-800 opacity-70'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 font-mono">
                      {comp.computer_id}
                      {!comp.network_connected && (
                        <WifiOff className="w-3.5 h-3.5 text-rose-400" title="Network disconnected" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-sans">{comp.name}</div>
                  </div>
                  <StatusBadge status={comp.status} size="sm" />
                </div>

                <div className="text-[11px] text-slate-400 font-mono mb-3 truncate">
                  {comp.os_name} • {comp.ip_address}
                </div>

                {/* Health Bar */}
                <div className="mb-4">
                  <HealthBar value={comp.health_score} label="Health Score" size="sm" />
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">CPU Load</span>
                    <span
                      className={`font-semibold ${
                        comp.cpu_percent >= 90
                          ? 'text-rose-400'
                          : comp.cpu_percent >= 80
                          ? 'text-amber-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {comp.cpu_percent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">RAM Load</span>
                    <span
                      className={`font-semibold ${
                        comp.ram_percent >= 90
                          ? 'text-rose-400'
                          : comp.ram_percent >= 85
                          ? 'text-amber-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {comp.ram_percent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">Disk Usage</span>
                    <span className="text-slate-200">{comp.disk_percent}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">Disk Health</span>
                    <span
                      className={
                        comp.disk_health <= 20
                          ? 'text-rose-400 font-bold'
                          : comp.disk_health <= 50
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }
                    >
                      {comp.disk_health}%
                    </span>
                  </div>
                </div>

                {/* Network & Active User */}
                <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Wifi className="w-3 h-3 text-blue-400" /> Net RX/TX
                    </span>
                    <span className="font-mono text-slate-300">
                      {comp.network_rx_kbps} / {comp.network_tx_kbps} KB/s
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-slate-500">
                      <User className="w-3 h-3 text-indigo-400" /> Active User
                    </span>
                    <span className="font-sans font-medium text-slate-200 truncate max-w-[110px]">
                      {comp.active_user || <span className="text-slate-500 italic">None</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-1.5">
                <Link
                  to={`/computers/${comp.computer_id}`}
                  className="flex-1 py-1 px-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded text-xs text-center font-medium transition"
                >
                  Diagnostics
                </Link>

                {comp.network_connected ? (
                  <button
                    onClick={() => handleDisconnect(comp.computer_id)}
                    disabled={isLoading}
                    className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded transition"
                    title="Disconnect Network Link"
                  >
                    <WifiOff className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleReconnect(comp.computer_id)}
                    disabled={isLoading}
                    className="p-1.5 text-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30 rounded transition"
                    title="Reconnect Network Link"
                  >
                    <Wifi className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => handleRecover(comp.computer_id)}
                  disabled={isLoading}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded transition"
                  title="Recover and Normalize Health"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
