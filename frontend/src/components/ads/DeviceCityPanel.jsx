import { useState, useEffect, useCallback } from "react";

const API = process.env.REACT_APP_BACKEND_URL;

export default function DeviceCityPanel({ token, dateFrom, dateTo }) {
  const [devices, setDevices]   = useState(null);
  const [cities,  setCities]    = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${token}` };
      const p = new URLSearchParams();
      if (dateFrom) p.set("date_from", dateFrom);
      if (dateTo)   p.set("date_to", dateTo);

      const [dRes, cRes] = await Promise.all([
        fetch(`${API}/api/cms/funnel/by-device?${p}`, { headers: h }),
        fetch(`${API}/api/cms/funnel/by-city?${p}&top_n=10`, { headers: h }),
      ]);
      if (dRes.ok) setDevices(await dRes.json());
      if (cRes.ok) setCities(await cRes.json());
    } finally {
      setLoading(false);
    }
  }, [token, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const deviceRows = devices?.rows || [];
  const cityRows   = cities?.rows  || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="device-city-panel">
      {/* Device panel */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
          Device Breakdown
        </h2>
        {loading && <div className="h-20 rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />}
        {!loading && deviceRows.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
            No device data available.
          </div>
        )}
        {!loading && deviceRows.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Device", "Leads", "Demo %", "Won", "Win%"].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deviceRows.map((r, i) => (
                  <tr key={i} data-testid={`device-row-${r.device}`} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-semibold capitalize text-slate-700">{r.device}</td>
                    <td className="px-4 py-2">{r.lead_in}</td>
                    <td className="px-4 py-2 text-blue-600">{r.schedule_rate}%</td>
                    <td className="px-4 py-2 text-emerald-600 font-semibold">{r.won}</td>
                    <td className="px-4 py-2">{r.lead_to_win_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* City panel */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
          Top Cities
        </h2>
        {loading && <div className="h-20 rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />}
        {!loading && cityRows.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
            No city data available.
          </div>
        )}
        {!loading && cityRows.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["City", "Leads", "Demo %", "Won", "Win%"].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cityRows.map((r, i) => (
                  <tr key={i} data-testid={`city-row-${i}`} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-semibold text-slate-700">{r.city}</td>
                    <td className="px-4 py-2">{r.lead_in}</td>
                    <td className="px-4 py-2 text-blue-600">{r.schedule_rate}%</td>
                    <td className="px-4 py-2 text-emerald-600 font-semibold">{r.won}</td>
                    <td className="px-4 py-2">{r.lead_to_win_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
