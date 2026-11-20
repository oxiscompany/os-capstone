import React, { useState, useEffect } from 'react';
import { Users2, User, Clock, Plus, LogOut } from 'lucide-react';
import { api } from '../api/client';
import { ComputerSession } from '../api/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useSimulation } from '../context/SimulationContext';

export const SessionManagementPage: React.FC = () => {
  const { computers, refreshManual } = useSimulation();
  const [sessions, setSessions] = useState<ComputerSession[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [targetPC, setTargetPC] = useState('PC-006');
  const [username, setUsername] = useState('student.ananya');

  const fetchSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch {
      // background
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSimulateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.simulateLogin(targetPC, username);
      setShowLoginModal(false);
      await refreshManual();
      await fetchSessions();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSimulateLogout = async (pcId: string) => {
    try {
      await api.simulateLogout(pcId);
      await refreshManual();
      await fetchSessions();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Student & Faculty Session Management
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              {sessions.length} Recorded Sessions
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of active user logins, workstation occupancy duration, and logout events.
          </p>
        </div>

        <button
          onClick={() => setShowLoginModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Simulate User Login</span>
        </button>
      </div>

      {/* Active Workstation Allocations */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {computers.map((c) => (
          <div key={c.computer_id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono font-bold text-white">{c.computer_id}</span>
              <StatusBadge status={c.active_user ? 'online' : 'offline'} size="sm" />
            </div>
            <div className="text-slate-400 text-[11px] mb-2 truncate">
              {c.active_user ? (
                <span className="text-blue-400 font-semibold">{c.active_user}</span>
              ) : (
                <span className="text-slate-500 italic">No Active Session</span>
              )}
            </div>
            {c.active_user && (
              <button
                onClick={() => handleSimulateLogout(c.computer_id)}
                className="w-full py-1 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded text-[10px] transition font-medium"
              >
                Terminate Session
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Sessions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Workstation</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Session Type</th>
                <th className="py-3 px-4">Login Time</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 italic font-sans">
                    No sessions logged yet.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400">#{s.id}</td>
                    <td className="py-3 px-4 text-blue-400 font-bold">{s.computer_id}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-white">{s.user_name}</td>
                    <td className="py-3 px-4 font-sans text-slate-400">{s.session_type}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {s.login_time ? new Date(s.login_time).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {Math.floor(s.duration_seconds / 60)} mins
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <StatusBadge status={s.status} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Simulate User Login</h3>
            <form onSubmit={handleSimulateLogin} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Target Workstation</label>
                <select
                  value={targetPC}
                  onChange={(e) => setTargetPC(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                >
                  {computers.map((c) => (
                    <option key={c.computer_id} value={c.computer_id}>
                      {c.computer_id} – {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">User Identity</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  placeholder="student.name"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold"
                >
                  Allocate Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
