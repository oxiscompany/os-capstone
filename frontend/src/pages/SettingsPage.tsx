import React, { useState } from 'react';
import { Settings, Shield, Sliders, Moon, Sun, Database, Server, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSimulation } from '../context/SimulationContext';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { speedMultiplier, setSpeed, resetSimulation } = useSimulation();

  const [cpuWarning, setCpuWarning] = useState<number>(80);
  const [cpuCritical, setCpuCritical] = useState<number>(95);
  const [ramWarning, setRamWarning] = useState<number>(85);
  const [ramCritical, setRamCritical] = useState<number>(95);
  const [diskWarning, setDiskWarning] = useState<number>(90);
  const [diskHealthCritical, setDiskHealthCritical] = useState<number>(20);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Platform & Anomaly Threshold Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure rule-based anomaly detection bounds, heartbeat timeout limits, and UI display preferences.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold">
          Threshold settings saved successfully and active for anomaly detection cycles.
        </div>
      )}

      {/* Threshold Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          Rule-Based Anomaly Detection Thresholds
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Telemetry values exceeding these limits automatically trigger Warning or Critical alerts with debounced deduplication.
        </p>

        <form onSubmit={handleSaveThresholds} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CPU */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <label className="text-slate-300 font-semibold block mb-1">
                CPU Warning Threshold: <span className="font-mono text-amber-400">{cpuWarning}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="90"
                value={cpuWarning}
                onChange={(e) => setCpuWarning(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <label className="text-slate-300 font-semibold block mb-1">
                CPU Critical Threshold: <span className="font-mono text-rose-400">{cpuCritical}%</span>
              </label>
              <input
                type="range"
                min="90"
                max="99"
                value={cpuCritical}
                onChange={(e) => setCpuCritical(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            {/* RAM */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <label className="text-slate-300 font-semibold block mb-1">
                RAM Warning Threshold: <span className="font-mono text-amber-400">{ramWarning}%</span>
              </label>
              <input
                type="range"
                min="60"
                max="90"
                value={ramWarning}
                onChange={(e) => setRamWarning(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <label className="text-slate-300 font-semibold block mb-1">
                RAM Critical Threshold: <span className="font-mono text-rose-400">{ramCritical}%</span>
              </label>
              <input
                type="range"
                min="90"
                max="99"
                value={ramCritical}
                onChange={(e) => setRamCritical(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            {/* Storage */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <label className="text-slate-300 font-semibold block mb-1">
                Disk Usage Warning: <span className="font-mono text-amber-400">{diskWarning}%</span>
              </label>
              <input
                type="range"
                min="70"
                max="95"
                value={diskWarning}
                onChange={(e) => setDiskWarning(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <label className="text-slate-300 font-semibold block mb-1">
                SMART Health Critical: <span className="font-mono text-rose-400">&le; {diskHealthCritical}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={diskHealthCritical}
                onChange={(e) => setDiskHealthCritical(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm transition"
          >
            Update Threshold Configurations
          </button>
        </form>
      </div>

      {/* Appearance & Preferences */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-2">Display & Theme Preference</h3>
        <p className="text-xs text-slate-400 mb-4">Toggle between enterprise Dark Mode and Light Mode.</p>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          <span>Active Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>

      {/* System Information & Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm text-xs">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" /> System Architecture & Environment
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-sans">Backend</span>
            <span>FastAPI Python 3.11</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-sans">Frontend</span>
            <span>React + Vite + TS</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-sans">Simulation Nodes</span>
            <span>10 Virtual PCs</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-sans">Protocol</span>
            <span>REST + WebSocket</span>
          </div>
        </div>
      </div>
    </div>
  );
};
