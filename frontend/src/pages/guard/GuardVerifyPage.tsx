import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, XCircle, Loader } from 'lucide-react';
import { validatePass, markExit, markEntry, type GatePass } from '../../services/passService';
import toast from 'react-hot-toast';

const GuardVerifyPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pass, setPass]       = useState<GatePass | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [invalidReason, setInvalidReason] = useState<string>('');

  const [pressedBtn, setPressedBtn] = useState<'exit' | 'entry' | null>(null);
  const [progress, setProgress]     = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }
    validatePass(id)
      .then(res => {
        setIsValid(res.valid);
        setPass(res.pass);
        if (!res.valid) setInvalidReason(res.reason ?? '');
      })
      .catch(err => {
        toast.error('Failed to verify pass.');
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handlePressStart = (type: 'exit' | 'entry') => {
    if (!isValid || !pass) return;
    setPressedBtn(type);
    setProgress(0);
    intervalRef.current = window.setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(intervalRef.current!); completeAction(type); return 100; }
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
    if (!id) return;
    try {
      if (type === 'exit') {
        await markExit(id);
        toast.success('Exit Marked Successfully!');
      } else {
        await markEntry(id);
        const updatedPass = pass;
        const now = new Date();
        const isLate = updatedPass ? now > updatedPass.expectedReturn : false;
        if (isLate) {
          toast.success('Entry Marked. Note: Returned LATE.', { icon: '⚠️', duration: 4000 });
        } else {
          toast.success('Entry Marked Successfully!');
        }
      }
      setTimeout(() => navigate('/guard/home'), 1000);
    } catch (err: any) {
      toast.error(err.message || `Failed to mark ${type}`);
      setPressedBtn(null);
      setProgress(0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center">
        <Loader className="animate-spin text-accent-primary" size={40} />
      </div>
    );
  }

  if (!pass) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6">
        <XCircle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold font-sora text-text-primary">Pass Not Found</h1>
        <button onClick={() => navigate('/guard/home')} className="mt-6 btn btn-secondary">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col page-enter max-w-lg mx-auto border-x border-border shadow-2xl">

      {/* Header Banner */}
      <div className={`text-white p-6 pt-10 rounded-b-[40px] shadow-lg relative overflow-hidden flex-shrink-0 ${isValid ? 'bg-emerald-500' : 'bg-red-500'}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <button onClick={() => navigate('/guard/home')} className="absolute top-8 left-4 p-2 bg-black/10 rounded-full backdrop-blur-sm">
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-center mt-6 relative z-10">
          {isValid ? <CheckCircle2 size={48} className="mb-2 drop-shadow-md" /> : <XCircle size={48} className="mb-2 drop-shadow-md" />}
          <h1 className="text-3xl font-black font-sora tracking-widest drop-shadow-md">{isValid ? 'VALID PASS' : 'INVALID PASS'}</h1>
          {!isValid && invalidReason && (
            <p className="text-red-100 text-sm mt-2 text-center">{invalidReason}</p>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 py-8 flex flex-col">
        {/* Student Card */}
        <div className={`bg-white rounded-3xl p-6 shadow-xl border-2 flex flex-col items-center text-center -mt-16 relative z-20 ${isValid ? 'border-emerald-100' : 'border-red-100'}`}>
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex flex-shrink-0 items-center justify-center text-white text-3xl font-black shadow-inner shadow-black/20 mb-4 border-4 border-white">
            {pass.studentName?.[0] ?? '?'}
          </div>
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">{pass.studentName}</h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="font-mono text-lg font-bold text-text-secondary">{pass.usn}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-border" />
            <span className="font-bold text-accent-primary">{pass.room}</span>
          </div>

          <div className="w-full bg-bg-muted mt-6 rounded-2xl p-4 text-left border border-border">
            <div className="mb-3 border-b border-border pb-3">
              <p className="text-[10px] font-bold uppercase text-text-muted mb-0.5">Dest. / Reason</p>
              <p className="font-bold text-sm">{pass.reasonDetail}</p>
            </div>
            <div className="mb-3 border-b border-border pb-3">
              <p className="text-[10px] font-bold uppercase text-text-muted mb-0.5">Verified at Gate</p>
              <p className="font-bold text-sm text-purple-700">
                {pass.exitTime ? `Exited at ${pass.exitTime.toLocaleTimeString()}` : 'Not yet exited'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-amber-700 mb-0.5">Must Return By</p>
              <p className="font-bold text-lg text-amber-700 tracking-tight">
                {pass.expectedReturn.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`mt-auto space-y-4 pt-6 ${!isValid && 'opacity-50 pointer-events-none'}`}>
          <p className="text-center text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Hold button to mark</p>

          <button
            onMouseDown={() => handlePressStart('exit')}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={() => handlePressStart('exit')}
            onTouchEnd={handlePressEnd}
            style={{ '--hold-progress': pressedBtn === 'exit' ? `${progress}%` : '0%' } as React.CSSProperties}
            className={`w-full h-20 rounded-2xl font-black font-sora text-2xl tracking-widest text-white shadow-xl flex items-center justify-center gap-3 transition-transform uppercase hold-progress overflow-hidden relative ${pressedBtn === 'exit' ? 'scale-95 bg-blue-700 shadow-none' : 'bg-accent-primary hover:-translate-y-1'}`}
          >
            <span className="relative z-10">🚪 MARK EXIT</span>
          </button>

          <button
            onMouseDown={() => handlePressStart('entry')}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={() => handlePressStart('entry')}
            onTouchEnd={handlePressEnd}
            style={{ '--hold-progress': pressedBtn === 'entry' ? `${progress}%` : '0%' } as React.CSSProperties}
            className={`w-full h-20 rounded-2xl font-black font-sora text-2xl tracking-widest text-white shadow-xl flex items-center justify-center gap-3 transition-transform uppercase hold-progress overflow-hidden relative ${pressedBtn === 'entry' ? 'scale-95 bg-emerald-700 shadow-none' : 'bg-accent-secondary hover:-translate-y-1'}`}
          >
            <span className="relative z-10">🏠 MARK ENTRY</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuardVerifyPage;
