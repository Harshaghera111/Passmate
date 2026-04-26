import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader, QrCode, AlertTriangle, Clock } from 'lucide-react';
import { getPass, type GatePass } from '../../services/passService';
import QRDisplay from '../../components/ui/QRDisplay';
import { format } from 'date-fns';

const PassViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pass,      setPass]      = useState<GatePass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound,  setNotFound]  = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); setIsLoading(false); return; }

    getPass(id)
      .then(data => {
        if (!data) setNotFound(true);
        else setPass(data);
      })
      .catch(err => {
        console.error('[PassViewPage] Failed to load pass:', err);
        setNotFound(true);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader className="animate-spin text-accent-primary" size={36} />
      </div>
    );
  }

  if (notFound || !pass) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 gap-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold font-sora text-text-primary">Pass Not Found</h2>
        <p className="text-text-muted text-sm">This pass may have been deleted or the link is invalid.</p>
        <button onClick={() => navigate(-1)} className="btn btn-secondary mt-2">
          <ChevronLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  const isApproved = pass.status === 'approved' || pass.status === 'active';
  const isExpired  = new Date() > pass.expectedReturn;

  return (
    <div className="min-h-screen bg-bg-base flex flex-col page-enter">

      {/* Header */}
      <div className={`text-white p-6 pt-10 pb-8 flex-shrink-0 ${isApproved && !isExpired ? 'bg-gradient-to-br from-accent-primary to-blue-600' : 'bg-gradient-to-br from-gray-600 to-gray-800'}`}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-white/80 hover:text-white text-sm font-medium mb-6 transition-colors"
        >
          <ChevronLeft size={18} /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
            <QrCode size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sora">Gate Pass</h1>
            <p className="text-blue-100 text-xs font-mono">#{pass.id.slice(0, 12)}</p>
          </div>

          {/* Status badge */}
          <div className="ml-auto">
            {isApproved && !isExpired ? (
              <span className="bg-white/20 border border-white/30 text-white text-xs px-3 py-1.5 rounded-badge font-bold uppercase tracking-wider backdrop-blur-sm">
                ✓ Valid
              </span>
            ) : isExpired ? (
              <span className="bg-red-500/30 border border-red-300/30 text-red-100 text-xs px-3 py-1.5 rounded-badge font-bold uppercase tracking-wider">
                Expired
              </span>
            ) : (
              <span className="bg-amber-500/30 border border-amber-300/30 text-amber-100 text-xs px-3 py-1.5 rounded-badge font-bold uppercase tracking-wider">
                {pass.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">

        {/* QR Code — only for approved passes */}
        {isApproved && !isExpired ? (
          <div className="flex justify-center">
            <QRDisplay
              value={pass.qrData ?? `passmate:${pass.id}`}
              passId={pass.id.slice(0, 12)}
              studentName={pass.studentName ?? 'Student'}
              usn={pass.usn ?? ''}
              validUntil={format(pass.expectedReturn, 'MMM d, yyyy – h:mm a')}
              size={220}
            />
          </div>
        ) : (
          /* Non-approved pass: informational card instead of QR */
          <div className={`rounded-2xl p-6 border text-center ${
            pass.status === 'pending' || pass.status === 'parent_approved'
              ? 'bg-amber-50 border-amber-200'
              : pass.status === 'rejected'
              ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
              {pass.status === 'rejected'
                ? <AlertTriangle size={28} className="text-red-500" />
                : pass.status === 'returned'
                ? <span className="text-2xl">✅</span>
                : <Clock size={28} className="text-amber-500" />
              }
            </div>
            <h3 className="font-bold text-lg font-sora capitalize">
              {pass.status === 'pending'         && 'Waiting for Approval'}
              {pass.status === 'parent_approved' && 'Waiting for Warden'}
              {pass.status === 'parent_rejected' && 'Parent Rejected'}
              {pass.status === 'rejected'        && 'Request Rejected'}
              {pass.status === 'returned'        && 'Pass Completed'}
              {pass.status === 'expired'         && 'Pass Expired'}
              {isExpired && isApproved           && 'Pass Expired'}
            </h3>
            <p className="text-sm text-text-muted mt-1">
              {pass.status === 'pending'  && 'Your pass is under review. You will be notified once approved.'}
              {pass.status === 'rejected' && (pass.wardenNote ? `Reason: "${pass.wardenNote}"` : 'Your request was not approved.')}
              {pass.status === 'returned' && 'You have successfully returned to campus.'}
            </p>
          </div>
        )}

        {/* Pass Details Card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-bg-muted border-b border-border">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Pass Details</p>
          </div>
          <div className="divide-y divide-border">
            {[
              { label: 'Student Name',    value: pass.studentName ?? '—'                                      },
              { label: 'USN',             value: pass.usn ?? '—',           mono: true                         },
              { label: 'Room',            value: pass.room ?? '—'                                              },
              { label: 'Hostel Block',    value: pass.hostel ?? '—'                                            },
              { label: 'Reason',          value: pass.reason ?? '—'                                            },
              { label: 'Details',         value: pass.reasonDetail ?? '—'                                      },
              { label: 'Out Time',        value: format(pass.outTime, 'EEE, MMM d · h:mm a')                  },
              { label: 'Return By',       value: format(pass.expectedReturn, 'EEE, MMM d · h:mm a')           },
              pass.exitTime  ? { label: 'Exited at',  value: format(pass.exitTime, 'EEE, MMM d · h:mm a')   } : null,
              pass.entryTime ? { label: 'Returned at', value: format(pass.entryTime, 'EEE, MMM d · h:mm a') } : null,
              pass.isLate    ? { label: 'Late Return', value: '⚠️ Yes — returned after expected time',        warn: true } : null,
            ].filter(Boolean).map((row: any) => (
              <div key={row.label} className="flex justify-between px-5 py-3 text-sm gap-4">
                <span className="text-text-muted font-medium flex-shrink-0">{row.label}</span>
                <span className={`text-right font-semibold ${row.mono ? 'font-mono' : ''} ${row.warn ? 'text-red-600' : 'text-text-primary'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Warden note */}
        {pass.wardenNote && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">Warden Note</p>
            <p className="text-sm text-amber-800 italic">"{pass.wardenNote}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassViewPage;
