import React from 'react';
import { Save, AlertTriangle, ShieldCheck } from 'lucide-react';

const AdminSettingsPage: React.FC = () => {

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Configuration saved successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto page-enter">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold font-sora text-text-primary">System Configuration</h1>
          <p className="text-text-muted mt-1 text-sm">Set global rules and automation logic for the gate pass system.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="space-y-6">
        
        {/* Pass Rules */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <h2 className="font-bold font-sora text-text-primary border-b border-border pb-3 mb-6 flex items-center gap-2">
            <ShieldCheck size={18} className="text-accent-primary" /> Core Pass Rules
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="float-label-group">
                <input type="number" defaultValue={24} />
                <label>Maximum Pass Duration (Hours)</label>
             </div>
             <div className="float-label-group">
                <input type="number" defaultValue={4} />
                <label>Max Passes Allowed Per Month</label>
             </div>
             <div className="float-label-group">
                <input type="time" defaultValue="21:00" />
                <label>Hostel Curfew Time (Evening)</label>
             </div>
             <div className="float-label-group">
                <input type="time" defaultValue="05:30" />
                <label>Gate Opening Time (Morning)</label>
             </div>
          </div>
        </div>

        {/* Automation Timers */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <h2 className="font-bold font-sora text-text-primary border-b border-border pb-3 mb-6 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Automation & Timers
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-text-primary text-sm">Parent Approval Timeout</p>
                <p className="text-xs text-text-muted mt-0.5">Automatically reject request if parent doesn't respond within this timeframe.</p>
              </div>
              <div className="w-32">
                <select className="w-full bg-bg-muted border border-border rounded-input px-3 py-2 text-sm outline-none">
                  <option value="2">2 Hours</option>
                  <option value="4">4 Hours</option>
                  <option value="8">8 Hours</option>
                  <option value="12" selected>12 Hours</option>
                  <option value="24">24 Hours</option>
                </select>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 pt-4 border-t border-border border-dashed">
              <div>
                <p className="font-semibold text-text-primary text-sm">QR Code Validity Buffer</p>
                <p className="text-xs text-text-muted mt-0.5">Time allowed to exit after the 'Out Time' has passed.</p>
              </div>
              <div className="w-32">
                <select className="w-full bg-bg-muted border border-border rounded-input px-3 py-2 text-sm outline-none">
                  <option value="15">15 Mins</option>
                  <option value="30" selected>30 Mins</option>
                  <option value="60">1 Hour</option>
                </select>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 pt-4 border-t border-border border-dashed">
               <div>
                  <p className="font-semibold text-text-primary text-sm flex items-center gap-2">
                     Strict Mode (Late Returns) 
                     <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-red-200">Warning Active</span>
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Automatically suspend passing privilege after N late returns in a month.</p>
               </div>
               <div className="flex items-center gap-3">
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" className="sr-only peer" defaultChecked />
                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                 </label>
                 <input type="number" defaultValue={3} className="w-16 bg-bg-muted border border-border rounded-input px-2 py-1 text-sm text-center outline-none" min={1} />
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSettingsPage;
