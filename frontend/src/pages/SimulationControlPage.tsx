import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Terminal,
  Activity,
  Gauge,
  Wifi,
  WifiOff,
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { api } from '../api/client';

export const SimulationControlPage: React.FC = () => {
  const {
    isSimulating,
    isPaused,
    speedMultiplier,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    setSpeed,
    computers,
    refreshManual
  } = useSimulation();

  const [selectedPC, setSelectedPC] = useState<string>('PC-001');
  const [manualCpu, setManualCpu] = useState<number>(85);
  const [manualRam, setManualRam] = useState<number>(90);
  const [manualDisk, setManualDisk] = useState<number>(80);
  const [events, setEvents] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const data = await api.getSimulationEvents(30);
      setEvents(data);
    } catch {
      // background
    }
  };

  React.useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyOverrides = async () => {
    try {
      await api.simulateComputer(selectedPC, {
        cpu_override: manualCpu,
        ram_override: manualRam,
        disk_override: manualDisk,
      });
      setStatusMessage(`Applied manual telemetry overrides to ${selectedPC}.`);
      await refreshManual();
      await fetchEvents();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.disconnectNetwork(selectedPC);
      setStatusMessage(`Network link disconnected for ${selectedPC}.`);
      await refreshManual();
      await fetchEvents();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  const handleReconnect = async () => {
    try {
      await api.reconnectNetwork(selectedPC);
      setStatusMessage(`Network link reconnected for ${selectedPC}.`);
      await refreshManual();
      await fetchEvents();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  const handleRecover = async () => {
    try {
      await api.recoverComputer(selectedPC);
      setStatusMessage(`Restored ${selectedPC} to normal operational state.`);
      await refreshManual();
      await fetchEvents();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Simulation Control Centre
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Master control panel for orchestrating simulation ticks, clock speed, and individual virtual computer overrides.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Global Controls & Simulation Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Global Lifecycle Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Global Simulation Engine
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Start, pause, resume, or reset all 10 independent virtual computer threads simultaneously.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
            <button
              onClick={startSimulation}
              disabled={isSimulating && !isPaused}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start</span>
            </button>

            <button
              onClick={pauseSimulation}
              disabled={!isSimulating || isPaused}
              className="py-2.5 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>

            <button
              onClick={resumeSimulation}
              disabled={!isPaused}
              className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>

            <button
              onClick={resetSimulation}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span>Simulation State:</span>
              <span className={`font-mono font-bold ${!isSimulating ? 'text-slate-400' : isPaused ? 'text-amber-400' : 'text-emerald-400'}`}>
                {!isSimulating ? 'STOPPED' : isPaused ? 'PAUSED' : 'ACTIVE SIMULATING'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Active Virtual Nodes:</span>
              <span className="font-mono text-white">10 independent PC instances</span>
            </div>
          </div>
        </div>

        {/* Speed & Interval Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-blue-400" />
              Simulation Speed Multiplier
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Control the virtual clock speed. Higher multipliers accelerate telemetry cycles and aging effects.
            </p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[0.5, 1.0, 2.0, 5.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeed(spd)}
                  className={`py-2 text-xs font-mono font-bold rounded-lg border transition ${
                    speedMultiplier === spd
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {spd}x Speed
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400">
            Current Rate: <span className="font-mono text-white font-bold">{speedMultiplier}x</span> normal speed (interval: {roundInterval(2.0 / speedMultiplier)}s per tick)
          </div>
        </div>
      </div>

      {/* Individual Computer Fault Injection Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Targeted Computer Manual Controls
            </h3>
            <p className="text-xs text-slate-400">Select any of the 10 virtual computers and inject specific conditions</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Select Computer:</span>
            <select
              value={selectedPC}
              onChange={(e) => setSelectedPC(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              {computers.map((c) => (
                <option key={c.computer_id} value={c.computer_id}>
                  {c.computer_id} – {c.name} ({c.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* CPU Slider */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-medium text-slate-300">Set CPU Load:</span>
              <span className="font-mono font-bold text-blue-400">{manualCpu}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={manualCpu}
              onChange={(e) => setManualCpu(Number(e.target.value))}
              className="w-full accent-blue-500 mb-4"
            />
            <button
              onClick={handleApplyOverrides}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition"
            >
              Apply CPU Override
            </button>
          </div>

          {/* RAM Slider */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-medium text-slate-300">Set RAM Usage:</span>
              <span className="font-mono font-bold text-purple-400">{manualRam}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={manualRam}
              onChange={(e) => setManualRam(Number(e.target.value))}
              className="w-full accent-purple-500 mb-4"
            />
            <button
              onClick={handleApplyOverrides}
              className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition"
            >
              Apply RAM Override
            </button>
          </div>

          {/* Network Link & Recovery */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="font-medium text-slate-300 text-xs block mb-1">Link & State Management</span>
              <p className="text-[11px] text-slate-400 mb-3">
                Disconnect physical interface or recover target to pristine state.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDisconnect}
                className="py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded text-xs font-medium border border-rose-500/30 transition flex items-center justify-center gap-1"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
              <button
                onClick={handleRecover}
                className="py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded text-xs font-medium border border-emerald-500/30 transition flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recover</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Simulation Events Stream Terminal */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Simulation Event Stream Terminal
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Real-time log of backend simulation operations, fault triggers, recoveries, and state transitions.
        </p>

        <div className="bg-black/80 rounded-lg p-3 font-mono text-xs text-slate-300 max-h-60 overflow-y-auto space-y-1.5 border border-slate-800">
          {events.length === 0 ? (
            <div className="text-slate-600 italic">Listening for simulation events...</div>
          ) : (
            events.map((ev, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-slate-600 select-none">[{new Date(ev.timestamp).toLocaleTimeString()}]</span>
                <span className="text-blue-400 font-semibold">{ev.computer_id}:</span>
                <span className="text-emerald-400">{ev.event_type}</span>
                <span className="text-slate-300">{ev.details}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

function roundInterval(n: number) {
  return Math.round(n * 10) / 10;
}
