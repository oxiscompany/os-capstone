import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Monitor, Users, Cpu, ShieldCheck, ArrowRight } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { StatusBadge } from '../components/common/StatusBadge';

export const LaboratoryPage: React.FC = () => {
  const { computers } = useSimulation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Laboratory Management & Floor Layout
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Physical layout arrangement, seating allocation, and workstation density mapping for Lab A.
        </p>
      </div>

      {/* Lab Information Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Systems & Simulation Lab A
                <span className="text-xs font-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                  LAB-101
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Turing Hall, 3rd Floor, Room 302 • Max Seating Capacity: 30
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Active Workstations</span>
              <span className="font-bold text-emerald-400 text-sm">10 Installed</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Lab Status</span>
              <span className="font-bold text-emerald-400 text-sm font-sans">Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2D Workstation Layout Pods */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Physical Laboratory Floor Plan</h3>
            <p className="text-xs text-slate-400">Interactive 2D schematic of virtual workstations arranged in 2 laboratory pods</p>
          </div>
          <div className="text-xs flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Online</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Warning</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Critical</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" /> Offline</span>
          </div>
        </div>

        {/* Podium Area */}
        <div className="mb-6 p-3 bg-slate-950/80 border border-dashed border-slate-800 rounded-lg text-center text-xs text-slate-400 font-medium">
          FRONT OF LABORATORY — INSTRUCTOR PODIUM & PROJECTION WALL
        </div>

        {/* Pod 1: PC-001 to PC-005 */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Workstation Pod 1 (Stations 01 - 05)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {computers.slice(0, 5).map((comp) => (
              <Link
                key={comp.computer_id}
                to={`/computers/${comp.computer_id}`}
                className="bg-slate-950 border border-slate-800 hover:border-blue-500 p-3 rounded-lg text-center transition group shadow-sm"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-mono text-xs font-bold text-white group-hover:text-blue-400">
                    {comp.computer_id}
                  </span>
                  <StatusBadge status={comp.status} size="sm" />
                </div>
                <div className="text-[11px] text-slate-400 truncate mb-2">{comp.name}</div>
                <div className="text-[10px] font-mono text-slate-500 bg-slate-900 py-1 rounded">
                  {comp.active_user ? (
                    <span className="text-blue-400">{comp.active_user}</span>
                  ) : (
                    <span>Idle</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Aisle Spacer */}
        <div className="py-2 text-center text-[10px] text-slate-400 uppercase font-mono tracking-widest border-y border-slate-800/60 my-4">
          === CENTRAL LAB AISLE ===
        </div>

        {/* Pod 2: PC-006 to PC-010 */}
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Workstation Pod 2 (Stations 06 - 10)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {computers.slice(5, 10).map((comp) => (
              <Link
                key={comp.computer_id}
                to={`/computers/${comp.computer_id}`}
                className="bg-slate-950 border border-slate-800 hover:border-blue-500 p-3 rounded-lg text-center transition group shadow-sm"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-mono text-xs font-bold text-white group-hover:text-blue-400">
                    {comp.computer_id}
                  </span>
                  <StatusBadge status={comp.status} size="sm" />
                </div>
                <div className="text-[11px] text-slate-400 truncate mb-2">{comp.name}</div>
                <div className="text-[10px] font-mono text-slate-500 bg-slate-900 py-1 rounded">
                  {comp.active_user ? (
                    <span className="text-blue-400">{comp.active_user}</span>
                  ) : (
                    <span>Idle</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
