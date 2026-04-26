import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ChevronLeft, XCircle, Loader,
  Clock, AlertTriangle, LogOut, LogIn, User,
} from 'lucide-react';
import { validatePass, markExit, markEntry, getPass, type GatePass } from '../../services/passService';
import { useAuthStore } from '../../store/authStore';
import { format, formatDistanceToNowStrict } from 'date-fns';
import toast from 'react-hot-toast';

// ─── Validation result categories ─────────────────────────────────────────────
type ValidState =
  | 'valid_exit'      // approved, not yet exited → can mark exit
  | 'valid_entry'     // active (already exited), not yet returned → can mark entry
  | 'already_out'     // active but trying exit again
  | 'already_returned'// returned — cannot act
  | 'expired'         // past expected return
  | 'not_approved'    // pending / rejected
  | 'not_found';      // no pass

interface VerifyResult {
  state: ValidState;
  pass: GatePass | null;
  message: string;
  color: 'green' | 'blue' | 'red' | 'amber';
}

function classify(pass: GatePass | null, rawReason?: string): VerifyResult {
  if (!pass) return { state: 'not_found', pass: null, message: 'Pass not found in the system.', color: 'red' };

  const now = new Date();

  if (pass.status === 'returned') {
    return { state: 'already_returned', pass, message: 'Student has already returned to campus.', color: 'amber' };
  }
  if (pass.status === 'expired') {
    return { state: 'expired', pass, message: 'This pass has expired and is no longer valid.', color: 'red' };
  }
  if (!['approved', 'active'].includes(pass.status)) {
    return { state: 'not_approved', pass, message: rawReason || `Pass status is "${pass.status}" — not approved yet.`, color: 'red' };
  }
  if (now > pass.expectedReturn) {
    return { state: 'expired', pass, message: 'Pass has expired: current time is past the expected return time.', color: 'red' };
  }
  if (pass.status === 'active' && pass.exitTime) {
    // Student is out — can mark entry
    return { state: 'valid_entry', pass, message: `Student is currently out since ${format(pass.exitTime, 'h:mm a')}. Mark entry when returning.`, color: 'blue' };
  }
  if (pass.status === 'approved' && !pass.exitTime) {
    // Student hasn't exited yet — can mark exit
    return { state: 'valid_exit', pass, message: 'Pass is valid. Ready to mark exit.', color: 'green' };
  }
  // Fallback
  return { state: 'not_approved', pass, message: 'Pass state could not be determined.', color: 'red' };
}

const COLOR_CLASSES = {
  green: { banner: 'bg-emerald-500',  border: 'border-emerald-100', icon: 'text-emerald-500' },
  blue:  { banner: 'bg-blue-500',     border: 'border-blue-100',    icon: 'text-blue-500'    },
  red:   { banner: 'bg-red-500',      border: 'border-red-100',     icon: 'text-red-500'     },
  amber: { banner: 'bg-amber-500',    border: 'border-amber-100',   icon: 'text-amber-500'   },
};

const LiveTimer: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState(() => formatDistanceToNowStrict(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(formatDistanceToNowStrict(targetDate));
    }, 60000); // update every minute
    return () => clearInterval(timer);
  }, [targetDate]);

  return <span className="ml-1 text-[11px] opacity-80 font-normal">({timeLeft} left)</span>;
};

const GuardVerifyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [result,    setResult]    = useState<VerifyResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [pressedBtn, setPressedBtn] = useState<'exit' | 'entry' | null>(null);
  const [progress,   setProgress]   = useState(0);
  const [acting,     setActing]     = useState(false);
  const intervalRef = useRef<number | null>(null);

  // ── Load + validate pass ───────────────────────────────────────────────────
  useEffect(() => {
    if (!id) {
      setResult({ state: 'not_found', pass: null, message: 'No pass ID provided.', color: 'red' });
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        // Use validatePass for the initial check, then getPass for full data
        const [validation, fullPass] = await Promise.all([
          validatePass(id),
          getPass(id),
        ]);
        const classified = classify(fullPass, validation.reason);
        setResult(classified);
      } catch (err: any) {
        console.error('[GuardVerify] Error:', err);
        toast.error('Failed to verify pass.');
        setResult({ state: 'not_found', pass: null, message: 'Failed to load pass data.', color: 'red' });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Hold-to-confirm logic ─────────────────────────────────────────────────
  const handlePressStart = (type: 'exit' | 'entry') => {
    if (!result?.pass || acting) return;
    setPressedBtn(type);
    setProgress(0);
    intervalRef.current = window.setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(intervalRef.current!);
          completeAction(type);
          return 100;
        }
        return p + 6.66;
      });
    }, 100);
  };

  const handlePressEnd = () => {
    if (progress < 100) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPressedBtn(null);
      setProgress(0);
    }
  };

  const completeAction = async (type: 'exit' | 'entry') => {
    if (!id || !result?.pass) return;
    setActing(true);
    try {
      if (type === 'exit') {
        await markExit(id, user?.uid);
        toast.success('✅ Exit marked successfully!');
      } else {
        await markEntry(id, user?.uid);
        const isLate = new Date() > result.pass.expectedReturn;
        if (isLate) {
          toast.success('⚠️ Entry marked — student returned LATE!', { duration: 4000 });
        } else {
          toast.success('✅ Entry marked — student has returned safely!');
        }
      }
      setTimeout(() => navigate('/guard/home'), 1200);
    } catch (err: any) {
      toast.error(err.message || `Failed to mark ${type}`);
      setPressedBtn(null);
      setProgress(0);
      setActing(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-3">
        <Loader className="animate-spin text-accent-primary" size={40} />
        <p className="text-text-muted text-sm font-medium">Verifying pass…</p>
      </div>
    );
  }

  if (!result) return null;

  const pass  = result.pass;
  const color = COLOR_CLASSES[result.color];
  const isActionable = result.state === 'valid_exit' || result.state === 'valid_entry';

  return (
    <div className="min-h-screen bg-bg-base flex flex-col page-enter max-w-lg mx-auto border-x border-border shadow-2xl">

      {/* ── Header Banner ── */}
      <div className={`text-white p-6 pt-10 rounded-b-[40px] shadow-lg relative overflow-hidden flex-shrink-0 ${color.banner}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

        <button
          onClick={() => navigate('/guard/home')}
          className="absolute top-8 left-4 p-2 bg-black/10 rounded-full backdrop-blur-sm"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="flex flex-col items-center mt-6 relative z-10">
          {result.state === 'valid_exit'        && <CheckCircle2 size={52} className="mb-2 drop-shadow-md" />}
          {result.state === 'valid_entry'       && <LogIn        size={52} className="mb-2 drop-shadow-md" />}
          {result.state === 'already_returned'  && <CheckCircle2 size={52} className="mb-2 drop-shadow-md opacity-70" />}
          {(result.state === 'expired' || result.state === 'not_approved' || result.state === 'not_found') && (
            <XCircle size={52} className="mb-2 drop-shadow-md" />
          )}
          {result.state === 'already_out'       && <AlertTriangle size={52} className="mb-2 drop-shadow-md" />}

          <h1 className="text-2xl font-black font-sora tracking-widest drop-shadow-md text-center">
            {result.state === 'valid_exit'       && 'VALID — READY TO EXIT'}
            {result.state === 'valid_entry'      && 'STUDENT IS OUT'}
            {result.state === 'already_returned' && 'ALREADY RETURNED'}
            {result.state === 'expired'          && 'PASS EXPIRED'}
            {result.state === 'not_approved'     && 'NOT APPROVED'}
            {result.state === 'not_found'        && 'PASS NOT FOUND'}
            {result.state === 'already_out'      && 'ALREADY EXITED'}
          </h1>
          <p className="text-white/80 text-sm mt-2 text-center max-w-xs leading-relaxed">
            {result.message}
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 flex flex-col overflow-y-auto">

        {/* ── Student Info Card ── */}
        {pass && (
          <div className={`bg-white rounded-3xl p-6 shadow-xl border-2 flex flex-col items-center text-center -mt-16 relative z-20 ${color.border}`}>
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-md border-4 border-white mb-4">
              {pass.studentName?.[0]?.toUpperCase() ?? <User size={28} />}
            </div>

            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">
              {pass.studentName ?? '—'}
            </h2>
            <div className="flex items-center justify-center gap-3 mt-1 text-sm">
              <span className="font-mono font-bold text-text-secondary">{pass.usn ?? '—'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-border" />
              <span className="font-bold text-accent-primary">Room {pass.room ?? '—'}</span>
            </div>

            {/* Details grid */}
            <div className="w-full bg-bg-muted mt-5 rounded-2xl p-4 text-left border border-border space-y-3">
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase text-text-muted mb-0.5">Reason</p>
                  <p className="font-bold text-text-primary">{pass.reason ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-text-muted mb-0.5">Hostel</p>
                  <p className="font-bold text-text-primary">{pass.hostel ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-text-muted mb-0.5">Out Time</p>
                  <p className="font-bold text-text-primary">{format(pass.outTime, 'MMM d, h:mm a')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-amber-700 mb-0.5">Return By</p>
                  <p className="font-bold text-amber-700">
                    {format(pass.expectedReturn, 'MMM d, h:mm a')}
                    {(result.state === 'valid_exit' || result.state === 'valid_entry') && (
                      <LiveTimer targetDate={pass.expectedReturn} />
                    )}
                  </p>
                </div>
              </div>

              {/* Exit time if already exited */}
              {pass.exitTime && (
                <div className="border-t border-border pt-3">
                  <p className="text-[10px] font-bold uppercase text-blue-700 mb-0.5">Exited Campus At</p>
                  <p className="font-bold text-blue-700 flex items-center gap-1">
                    <LogOut size={13} />
                    {format(pass.exitTime, 'MMM d, h:mm a')}
                  </p>
                </div>
              )}

              {/* Entry time if returned */}
              {pass.entryTime && (
                <div className="border-t border-border pt-3">
                  <p className="text-[10px] font-bold uppercase text-emerald-700 mb-0.5">Returned At</p>
                  <p className={`font-bold flex items-center gap-1 ${pass.isLate ? 'text-red-600' : 'text-emerald-700'}`}>
                    <LogIn size={13} />
                    {format(pass.entryTime, 'MMM d, h:mm a')}
                    {pass.isLate && ' ⚠️ LATE'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Action Buttons (hold-to-confirm) ── */}
        {isActionable && pass && (
          <div className="mt-auto pt-6 space-y-4">
            <p className="text-center text-xs font-bold text-text-muted uppercase tracking-wider">
              Hold button to confirm
            </p>

            {/* MARK EXIT — shown when student hasn't exited yet */}
            {result.state === 'valid_exit' && (
              <button
                onMouseDown={() => handlePressStart('exit')}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={(e) => { e.preventDefault(); handlePressStart('exit'); }}
                onTouchEnd={handlePressEnd}
                disabled={acting}
                style={{ '--hold-progress': pressedBtn === 'exit' ? `${progress}%` : '0%' } as React.CSSProperties}
                className={`w-full h-20 rounded-2xl font-black font-sora text-2xl tracking-widest text-white shadow-xl flex items-center justify-center gap-3 transition-all uppercase hold-progress overflow-hidden relative select-none
                  ${pressedBtn === 'exit' ? 'scale-95 bg-blue-700 shadow-none' : 'bg-accent-primary hover:-translate-y-1'}
                  ${acting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span className="relative z-10 flex items-center gap-3">
                  <LogOut size={28} />
                  MARK EXIT
                </span>
              </button>
            )}

            {/* MARK ENTRY — shown when student is out */}
            {result.state === 'valid_entry' && (
              <button
                onMouseDown={() => handlePressStart('entry')}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={(e) => { e.preventDefault(); handlePressStart('entry'); }}
                onTouchEnd={handlePressEnd}
                disabled={acting}
                style={{ '--hold-progress': pressedBtn === 'entry' ? `${progress}%` : '0%' } as React.CSSProperties}
                className={`w-full h-20 rounded-2xl font-black font-sora text-2xl tracking-widest text-white shadow-xl flex items-center justify-center gap-3 transition-all uppercase hold-progress overflow-hidden relative select-none
                  ${pressedBtn === 'entry' ? 'scale-95 bg-emerald-700 shadow-none' : 'bg-accent-secondary hover:-translate-y-1'}
                  ${acting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span className="relative z-10 flex items-center gap-3">
                  <LogIn size={28} />
                  MARK ENTRY
                </span>
              </button>
            )}

            <p className="text-center text-xs text-text-muted">
              <Clock size={11} className="inline mr-1" />
              Current time: {format(new Date(), 'h:mm:ss a')}
            </p>
          </div>
        )}

        {/* Non-actionable state: go back button */}
        {!isActionable && (
          <div className="mt-auto pt-6">
            <button
              onClick={() => navigate('/guard/home')}
              className="w-full h-14 btn btn-secondary text-base font-bold"
            >
              <ChevronLeft size={20} /> Back to Scanner
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardVerifyPage;
