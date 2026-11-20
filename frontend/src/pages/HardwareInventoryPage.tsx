import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, ShieldCheck, Plus, Filter, Search } from 'lucide-react';
import { api } from '../api/client';
import { HardwareItem } from '../api/types';
import { StatusBadge } from '../components/common/StatusBadge';

export const HardwareInventoryPage: React.FC = () => {
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New hardware form
  const [newCompId, setNewCompId] = useState('PC-001');
  const [newType, setNewType] = useState('RAM');
  const [newBrand, setNewBrand] = useState('Crucial');
  const [newModel, setNewModel] = useState('16GB DDR5 5600MHz');
  const [newSerial, setNewSerial] = useState('SN-RAM-99824');

  const fetchHardware = async () => {
    try {
      const data = await api.getHardware();
      setHardware(data);
    } catch {
      // background
    }
  };

  useEffect(() => {
    fetchHardware();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createHardware({
        computer_id: newCompId,
        component_type: newType,
        brand: newBrand,
        model: newModel,
        serial_number: newSerial,
        status: 'operational',
      });
      setShowAddModal(false);
      await fetchHardware();
    } catch (err: any) {
      alert(`Error creating hardware item: ${err.message}`);
    }
  };

  const filtered = hardware.filter((h) => {
    const matchesType = filterType === 'all' || h.component_type.toLowerCase() === filterType.toLowerCase();
    const matchesSearch =
      h.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.computer_id && h.computer_id.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Hardware Asset Inventory
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              {filtered.length} Assets
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Component tracking, serial registries, and warranty records across laboratory machines.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Hardware</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by model, serial, workstation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
          {['all', 'CPU', 'RAM', 'Storage'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded transition font-medium ${
                filterType === t ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Hardware Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Component</th>
                <th className="py-3 px-4">Brand & Model</th>
                <th className="py-3 px-4">Workstation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Purchase Date</th>
                <th className="py-3 px-4">Warranty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-semibold text-white">{item.serial_number}</td>
                  <td className="py-3 px-4 font-sans">
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      {item.component_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <div className="font-semibold text-white">{item.brand}</div>
                    <div className="text-[11px] text-slate-400">{item.model}</div>
                  </td>
                  <td className="py-3 px-4 text-blue-400 font-bold">{item.computer_id || 'Spares Pool'}</td>
                  <td className="py-3 px-4 font-sans">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 text-[11px] font-sans">Active Warranty</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Hardware Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Register New Hardware Asset</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Target Workstation ID</label>
                <input
                  type="text"
                  value={newCompId}
                  onChange={(e) => setNewCompId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  placeholder="PC-001"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Component Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                >
                  <option value="CPU">CPU</option>
                  <option value="RAM">RAM</option>
                  <option value="Storage">Storage</option>
                  <option value="GPU">GPU</option>
                  <option value="Motherboard">Motherboard</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Brand</label>
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  placeholder="Intel / AMD / Corsair"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Model Specifications</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  placeholder="Model name and technical spec"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Serial Number</label>
                <input
                  type="text"
                  value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  placeholder="SN-XXXX-XXXX"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
