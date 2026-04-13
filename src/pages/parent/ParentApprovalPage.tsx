import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, X, Check, MapPin, Clock, Info } from 'lucide-react';
import { mockPasses } from '../../data/mockData';
import OTPInput from '../../components/ui/OTPInput';

const ParentApprovalPage: React.FC = () => {
  const { id } = useParams();
  const pass = mockPasses.find(p => p.id === id) || mockPasses[2]; // fallback for demo
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [note, setNote] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleAction = (type: 'approve' | 'reject') => {
    setAction(type);
    if (type === 'reject') {
      // Need note for rejection, don't auto-advance
    } else {
      setStep(2);
    }
  };

  const submitRejection = () => {
    if (!note) return;
    setStep(2);
  };

  const handleVerify = () => {
    if (otp.join('').length !== 6) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setStep(3);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4 selection:bg-accent-primary selection:text-white page-enter">
      {/* Centered focused card */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-border overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-hero p-5 text-white text-center rounded-b-2xl shadow-md z-10 relative">
          <div className="w-10 h-10 mx-auto bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-3">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold font-sora">Secure Parent Portal</h1>
          <p className="text-blue-100 text-xs mt-1 font-medium">Verify & Approve Gate Pass</p>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              
              {/* Student Info */}
              <div className="flex items-center gap-4 bg-bg-muted p-4 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">
                  {pass.studentName[0]}
                </div>
                <div>
                  <h2 className="font-bold text-text-primary leading-tight">{pass.studentName}</h2>
                  <p className="text-xs text-text-muted mt-0.5">{pass.usn} • {pass.room}</p>
                </div>
              </div>

              {/* Request Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1.5"><MapPin size={12}/> Reason / Destination</p>
                  <p className="font-medium text-text-primary text-sm bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                    {pass.reasonDetail}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-muted p-3 rounded-lg">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1.5"><Clock size={12}/> Outing Time</p>
                    <p className="font-semibold text-text-primary text-sm">Today, 2:00 PM</p>
                  </div>
                  <div className="bg-bg-muted p-3 rounded-lg border border-amber-200/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-amber-100 rotate-45 translate-x-4 -translate-y-4" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1 flex items-center gap-1.5">Expected Return</p>
                    <p className="font-semibold text-text-primary text-sm">Today, 8:00 PM</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border">
                {action === 'reject' ? (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <textarea 
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Please provide a reason for rejection..."
                      className="w-full text-sm border-2 border-red-200 focus:border-red-500 rounded-lg p-3 resize-none outline-none focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setAction(null)} className="btn btn-ghost flex-1">Cancel</button>
                      <button onClick={submitRejection} disabled={!note} className="btn btn-danger flex-1">Confirm Reject</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleAction('reject')}
                      className="btn btn-danger-outline flex-1 group"
                    >
                      <X size={18} className="group-hover:scale-110 transition-transform" /> Reject
                    </button>
                    <button 
                      onClick={() => handleAction('approve')}
                      className="btn btn-success flex-1 shadow-lg shadow-emerald-500/20 group hover:-translate-y-0.5 transition-all"
                    >
                      <Check size={18} className="group-hover:scale-110 transition-transform" /> Approve
                    </button>
                  </div>
                )}
              </div>
              
              <p className="text-[10px] text-center text-text-muted flex items-center justify-center gap-1 mt-4">
                <Info size={10} /> This link is unique and expires in 2 hours.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 py-4 text-center">
              <div>
                <h2 className="text-xl font-bold font-sora text-text-primary">Verify it's you</h2>
                <p className="text-sm text-text-muted mt-2 leading-relaxed">
                  To confirm your {action === 'approve' ? <strong className="text-emerald-600 font-bold">APPROVAL</strong> : <strong className="text-red-500 font-bold">REJECTION</strong>}, please enter the OTP sent to <br/><strong className="text-text-primary">+91 XXXXXX1234</strong>
                </p>
              </div>

              <OTPInput value={otp} onChange={setOtp} disabled={isVerifying} />

              <div className="space-y-4">
                <button 
                  onClick={handleVerify}
                  disabled={otp.join('').length !== 6 || isVerifying}
                  className={`btn w-full h-12 text-[15px] ${action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                >
                  {isVerifying ? 'Verifying...' : `Confirm ${action === 'approve' ? 'Approval' : 'Rejection'}`}
                </button>
                <div className="flex justify-between items-center px-2">
                  <button onClick={() => setStep(1)} className="text-xs font-semibold text-text-secondary hover:text-text-primary">← Back</button>
                  <button className="text-xs font-semibold text-accent-primary">Resend OTP (0:45)</button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-8 text-center animate-in zoom-in-95 duration-500 space-y-6">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center flex-shrink-0 relative ${action === 'approve' ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-500'}`}>
                {/* Ping animation effect */}
                <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${action === 'approve' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{animationDuration: '2s'}}/>
                {action === 'approve' ? <Check size={40} strokeWidth={3} /> : <X size={40} strokeWidth={3} />}
              </div>
              
              <div>
                <h2 className="text-2xl font-bold font-sora text-text-primary">
                  {action === 'approve' ? 'Approval Confirmed!' : 'Request Rejected'}
                </h2>
                <p className="text-text-muted mt-2 text-sm max-w-[260px] mx-auto">
                  {action === 'approve' 
                    ? `You have successfully approved ${pass.studentName}'s gate pass request.`
                    : `You have denied ${pass.studentName}'s gate pass request.`}
                </p>
              </div>

              <div className="bg-bg-muted p-4 rounded-xl text-left border border-border">
                <h3 className="font-semibold text-sm mb-3 text-text-primary border-b border-border pb-2">Summary</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-text-muted">Student:</span> <span className="font-medium text-text-primary">{pass.studentName}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Out Time:</span> <span className="font-medium text-text-primary">Today, 2:00 PM</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Status:</span> 
                    <span className={`font-bold uppercase ${action === 'approve' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {action === 'approve' ? 'Approved by Parent' : 'Rejected by Parent'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-text-muted">
                If this wasn't you, <a href="#" className="text-accent-primary hover:underline font-semibold">contact the warden</a> immediately.
              </p>
              <p className="text-[11px] font-medium text-text-secondary mt-6">You may now close this window.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ParentApprovalPage;
