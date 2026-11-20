import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, Plus, DollarSign } from 'lucide-react';
import { api } from '../api/client';
import { SoftwareLicense } from '../api/types';

export const LicenseManagementPage: React.FC = () => {
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([]);

  const fetchLicenses = async () => {
    try {
      const data = await api.getLicenses();
      setLicenses(data);
    } catch {
      // background
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Software License Registry
          <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
            {licenses.length} Contracts
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Seat pool utilization, perpetual and educational subscription renewals, and license key compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {licenses.map((lic) => {
          const utilPercent = Math.round((lic.used_seats / lic.total_seats) * 100);

          return (
            <div
              key={lic.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                    License ID #{lic.id}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">${lic.cost}</span>
                </div>

                <div className="font-mono text-xs font-bold text-white mb-2 break-all bg-slate-950 p-2 rounded border border-slate-800">
                  {lic.license_key}
                </div>

                <div className="text-xs text-slate-300 font-semibold mb-4">{lic.license_type}</div>

                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Seat Pool Utilization:</span>
                    <span className="font-mono font-bold text-white">
                      {lic.used_seats} / {lic.total_seats} Seats ({utilPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        utilPercent > 90 ? 'bg-rose-500' : utilPercent > 70 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${utilPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                <span>Expiry: {lic.expiry_date ? new Date(lic.expiry_date).toLocaleDateString() : 'Perpetual'}</span>
                <span className="text-emerald-400 font-medium">Valid Contract</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
