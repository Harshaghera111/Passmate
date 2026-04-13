import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const WardenEmergencyPage: React.FC = () => {
  const { user } = useAuthStore();
  const [usn, setUsn] = useState('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('2');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usn || !reason) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setUsn('');
      setReason('');
      alert('Emergency Pass Issued Successfully. Generating QR...');
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sora text-text-primary">Emergency Override</h1>
        <p className="text-text-muted mt-1 text-sm">Issue an immediate gate pass, bypassing parent approval.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex flex-shrink-0 items-center justify-center text-amber-600">
             <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 text-lg">Use with caution</h3>
            <p className="text-amber-700 text-sm mt-1 leading-relaxed">
              This action immediately generates an active Gate Pass for the student without parent consent.
              <strong> This event will be logged and audited by the Administration.</strong>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8 space-y-6">
        
        <div className="grid grid-cols-1 gap-6">
          <div className="float-label-group">
            <input 
              type="text" 
              value={usn}
              onChange={(e) => setUsn(e.target.value.toUpperCase())}
              placeholder=" "
              required
            />
            <label>Student USN / ID</label>
          </div>

          <div className="float-label-group">
             <select value={duration} onChange={(e) => setDuration(e.target.value)} className="appearance-none">
               <option value="1">1 Hour</option>
               <option value="2">2 Hours</option>
               <option value="4">4 Hours</option>
               <option value="8">8 Hours</option>
               <option value="24">24 Hours</option>
             </select>
             <label>Time Limit</label>
          </div>

          <div className="float-label-group">
             <textarea 
               value={reason}
               onChange={(e) => setReason(e.target.value)}
               placeholder=" "
               rows={3}
               className="resize-none pt-6"
               required
             />
             <label>Specific Reason / Medical Emergency Details</label>
          </div>
        </div>

        <div className="bg-bg-muted p-4 rounded-xl border border-border flex items-center justify-between text-sm">
           <div>
              <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Authorized By</p>
              <p className="font-semibold text-text-primary flex items-center gap-2">
                <ShieldAlert size={14} className="text-accent-primary" /> {user?.name}
              </p>
           </div>
           <p className="font-mono text-text-muted bg-white px-3 py-1.5 rounded-lg border border-border border-dashed">
             IP: 192.168.1.45
           </p>
        </div>

        <button 
          type="submit" 
          disabled={!usn || !reason || isSubmitting}
          className="btn w-full h-14 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-lg rounded-xl shadow-lg shadow-red-600/20 group"
        >
           {isSubmitting ? 'Processing Audit Log...' : <><AlertTriangle size={20} className="mr-1 group-hover:scale-110 transition-transform" /> Issue Emergency Pass</>}
        </button>
      </form>
    </div>
  );
};

export default WardenEmergencyPage;
