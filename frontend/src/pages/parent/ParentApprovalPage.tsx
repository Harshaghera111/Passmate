import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, ShieldCheck, Loader, AlertCircle } from 'lucide-react';
import { getPass, parentApprove, type GatePass } from '../../services/passService';
import toast from 'react-hot-toast';

const ParentApprovalPage: React.FC = () => {
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const passId = paramId || searchParams.get('id') || '';

  const [pass, setPass]         = useState<GatePass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionDone, setActionDone] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!passId) { setIsLoading(false); return; }
    getPass(passId)
      .then(p => setPass(p))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [passId]);

  const handleDecision = async (approve: boolean) => {
    if (!passId || !pass) return;
    setActionLoading(true);
    try {
      await parentApprove(passId, approve);
      setDecision(approve ? 'approved' : 'rejected');
      setActionDone(true);
      toast.success(approve ? 'Pass approved by parent!' : 'Pass rejected by parent.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit decision');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader className="animate-spin text-accent-primary" size={40} />
      </div>
    );
  }

  if (!pass) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-text-primary">Pass Not Found</h1>
        <p className="text-text-muted mt-2">The approval link may be invalid or expired.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-blue-900/10 border border-border overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-hero p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl scale-150" />
          <div className="relative z-10">
            <ShieldCheck size={48} className="mx-auto mb-3 drop-shadow-md" />
            <h1 className="text-2xl font-black font-sora">Parent Approval</h1>
            <p className="text-blue-100 text-sm mt-1">PassMate Gate Pass Request</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Student Info */}
          <div className="flex items-center gap-4 bg-bg-muted p-4 rounded-2xl border border-border">
            <div className="w-14 h-14 bg-gradient-hero text-white rounded-full flex items-center justify-center font-black text-2xl shadow-inner shadow-black/20">
              {pass.studentName?.[0] ?? 'S'}
            </div>
            <div>
              <p className="font-bold text-text-primary text-lg">{pass.studentName}</p>
              <p className="text-text-muted text-xs font-mono">{pass.usn} · Room {pass.room}</p>
            </div>
          </div>

          {/* Pass Details */}
          <div className="bg-bg-muted rounded-2xl border border-border p-4 space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-text-muted flex-shrink-0" />
              <div>
                <p className="text-xs text-text-muted">Out Time</p>
                <p className="font-semibold text-text-primary">{format(pass.outTime, 'MMM d, h:mm a')}</p>
              </div>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-text-muted">Expected Return</p>
                <p className="font-semibold text-text-primary">{format(pass.expectedReturn, 'MMM d, h:mm a')}</p>
              </div>
            </div>
            <div className="border-t border-border" />
            <div>
              <p className="text-xs text-text-muted mb-1">Reason</p>
              <p className="font-semibold text-text-primary">{pass.reasonDetail}</p>
            </div>
          </div>

          {/* Action / Result */}
          {actionDone ? (
            <div className={`rounded-2xl p-6 text-center border-2 ${decision === 'approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              {decision === 'approved'
                ? <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
                : <XCircle size={48} className="text-red-500 mx-auto mb-3" />}
              <h2 className="text-xl font-black font-sora text-text-primary mb-1">
                {decision === 'approved' ? 'Pass Approved!' : 'Pass Rejected'}
              </h2>
              <p className="text-sm text-text-muted">
                {decision === 'approved'
                  ? "The warden will receive this decision. Your ward's safety is our priority."
                  : 'The hostel has been notified of your rejection.'}
              </p>
            </div>
          ) : pass.parentApproved !== null ? (
            <div className={`rounded-2xl p-5 text-center border-2 ${pass.parentApproved ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              {pass.parentApproved
                ? <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                : <XCircle size={32} className="text-red-500 mx-auto mb-2" />}
              <p className="font-semibold text-text-primary">
                You have already {pass.parentApproved ? 'approved' : 'rejected'} this pass.
              </p>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => handleDecision(false)}
                disabled={actionLoading}
                className="flex-1 py-4 rounded-2xl bg-red-50 text-red-600 font-black text-lg border-2 border-red-200 hover:bg-red-100 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader className="animate-spin" size={20} /> : <XCircle size={20} />}
                Reject
              </button>
              <button
                onClick={() => handleDecision(true)}
                disabled={actionLoading}
                className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-black text-lg border-2 border-emerald-500 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                Approve
              </button>
            </div>
          )}

          <p className="text-center text-xs text-text-muted">
            Powered by <span className="font-semibold text-accent-primary">PassMate</span> · Secure Hostel Gate Pass System
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParentApprovalPage;
