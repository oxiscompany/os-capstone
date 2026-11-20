import React, { useState, useEffect } from 'react';
import { Package, ShieldAlert, ShieldCheck, Plus, Search } from 'lucide-react';
import { api } from '../api/client';
import { SoftwareItem } from '../api/types';

export const SoftwareManagementPage: React.FC = () => {
  const [software, setSoftware] = useState<SoftwareItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [publisher, setPublisher] = useState('');
  const [category, setCategory] = useState('Development');
  const [isApproved, setIsApproved] = useState(true);

  const fetchSoftware = async () => {
    try {
      const data = await api.getSoftware();
      setSoftware(data);
    } catch {
      // background
    }
  };

  useEffect(() => {
    fetchSoftware();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSoftware({
        name,
        version,
        publisher,
        category,
        is_approved: isApproved,
        min_ram_gb: 2.0,
      });
      setShowAddModal(false);
      await fetchSoftware();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const filtered = software.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.publisher && s.publisher.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Software Catalog & Compliance
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              {software.length} Packages
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Approved laboratory packages, security enforcement, and detection of unauthorized binaries.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Software Package</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search software catalog..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Software Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Software Name</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Publisher</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4">Min RAM Spec</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className={`hover:bg-slate-800/40 transition ${
                    !s.is_approved ? 'bg-rose-500/5' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <span className="font-bold text-white block">{s.name}</span>
                    {s.notes && <span className="text-[10px] text-rose-400 block">{s.notes}</span>}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{s.version}</td>
                  <td className="py-3 px-4 text-slate-400">{s.publisher || 'Unknown'}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      {s.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {s.is_approved ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                        <ShieldAlert className="w-3.5 h-3.5" /> UNAUTHORIZED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{s.min_ram_gb} GB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Register Software</h3>
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Software Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  placeholder="e.g. AutoCAD 2026"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Version</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  placeholder="24.1.0"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Publisher</label>
                <input
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  placeholder="Autodesk"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="approved"
                  checked={isApproved}
                  onChange={(e) => setIsApproved(e.target.checked)}
                  className="accent-blue-500 w-4 h-4"
                />
                <label htmlFor="approved" className="text-slate-300">
                  Approved for Student & Faculty Execution
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
