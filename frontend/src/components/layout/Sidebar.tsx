import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Sliders,
  Flame,
  Building2,
  Cpu,
  Package,
  KeyRound,
  CalendarCheck,
  Users2,
  LineChart,
  BellRing,
  Settings,
  Server,
  TerminalSquare
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const Sidebar: React.FC = () => {
  const { isSimulating, isPaused, computers } = useSimulation();

  const navGroups = [
    {
      label: 'Monitoring & Core',
      items: [
        { to: '/', label: 'Main Dashboard', icon: LayoutDashboard },
        { to: '/monitoring', label: 'Live Monitoring', icon: Activity, badge: `${computers.length} PCs` },
      ],
    },
    {
      label: 'Simulation Engine',
      items: [
        { to: '/simulation-control', label: 'Control Centre', icon: Sliders },
        { to: '/scenarios', label: 'Fault Scenarios', icon: Flame },
      ],
    },
    {
      label: 'Lab Infrastructure',
      items: [
        { to: '/laboratories', label: 'Lab Map & Layout', icon: Building2 },
        { to: '/hardware', label: 'Hardware Inventory', icon: Cpu },
        { to: '/software', label: 'Software Catalog', icon: Package },
        { to: '/licenses', label: 'License Manager', icon: KeyRound },
      ],
    },
    {
      label: 'Management',
      items: [
        { to: '/bookings', label: 'Lab Bookings', icon: CalendarCheck },
        { to: '/sessions', label: 'Session Tracking', icon: Users2 },
      ],
    },
    {
      label: 'Analytics & Quality',
      items: [
        { to: '/analytics', label: 'Analytics & Forecasts', icon: LineChart },
        { to: '/alerts', label: 'Alerts Centre', icon: BellRing },
        { to: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-950/40">
        <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg shadow-md shadow-blue-500/20">
          <Server className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            LabNexus
            <span className="text-[10px] bg-blue-500/20 text-blue-400 font-mono px-1.5 py-0.2 rounded border border-blue-500/30">v1.0</span>
          </h1>
          <p className="text-[11px] text-slate-400">Intelligent Lab Simulator</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Simulation Engine Status Widget */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <TerminalSquare className="w-3.5 h-3.5 text-blue-400" />
              Engine Status
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                !isSimulating
                  ? 'bg-slate-800 text-slate-400'
                  : isPaused
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
              }`}
            >
              {!isSimulating ? 'STOPPED' : isPaused ? 'PAUSED' : 'SIMULATING'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            10 virtual computers active in background simulation loop.
          </p>
        </div>
      </div>
    </aside>
  );
};
