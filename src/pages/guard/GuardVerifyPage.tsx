import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { mockPasses } from '../../data/mockData';

const GuardVerifyPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const pass = mockPasses.find(p => p.id === id);
  
  const [pressedBtn, setPressedBtn] = useState<'exit' | 'entry' | null>(null);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);

  if (!pass) return <div className="p-8 text-center bg-red-500 text-white font-bold min-h-screen">Pass Data Error</div>;

  const handlePressStart = (type: 'exit' | 'entry') => {
    setPressedBtn(type);
    setProgress(0);
    // Hold to confirm mock (requires holding for 1.5s total)
    intervalRef.current = window.setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(intervalRef.current!);
          completeAction(type);
          return 100;
        }
        return p + 6.66; // 100 / 15 ticks of 100ms
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

  const completeAction = (type: 'exit' | 'entry') => {
    // In real app, make API call
    setTimeout(() => {
      alert(`Marked ${type} successfully!`);
      navigate('/guard/home');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col page-enter max-w-lg mx-auto border-x border-border shadow-2xl">
      
      {/* Success Banner Header */}
      <div className="bg-emerald-500 text-white p-6 pt-10 rounded-b-[40px] shadow-lg relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl flex-shrink-0" />
        <button onClick={() => navigate('/guard/home')} className="absolute top-8 left-4 p-2 bg-black/10 rounded-full backdrop-blur-sm">
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-center mt-6 relative z-10">
          <CheckCircle2 size={48} className="mb-2 drop-shadow-md" />
          <h1 className="text-3xl font-black font-sora tracking-widest drop-shadow-md">VALID PASS</h1>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 flex flex-col">
        
        {/* Large Student Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-emerald-100 flex flex-col items-center text-center -mt-16 relative z-20">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex flex-shrink-0 items-center justify-center text-white text-3xl font-black shadow-inner shadow-black/20 mb-4 border-4 border-white">
            {pass.studentName[0]}
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
              <p className="text-[10px] font-bold uppercase text-text-muted mb-0.5">Approved By Warden</p>
              <p className="font-bold text-sm text-purple-700">{pass.wardenName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-amber-700 mb-0.5">Must Return By</p>
              <p className="font-bold text-lg text-amber-700 tracking-tight">Today, 8:00 PM</p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Giant Touch Targets */}
        <div className="mt-auto space-y-4 pt-6">
          <p className="text-center text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Hold button to mark</p>
          
          <button
            onMouseDown={() => handlePressStart('exit')}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={() => handlePressStart('exit')}
            onTouchEnd={handlePressEnd}
            style={{ '--hold-progress': pressedBtn === 'exit' ? `${progress}%` : '0%' } as React.CSSProperties}
            className={`w-full h-20 rounded-2xl font-black font-sora text-2xl tracking-widest text-white shadow-xl flex items-center justify-center gap-3 transition-transform uppercase hold-progress overflow-hidden relative ${
              pressedBtn === 'exit' ? 'scale-95 bg-blue-700 shadow-none' : 'bg-accent-primary hover:-translate-y-1'
            }`}
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
            className={`w-full h-20 rounded-2xl font-black font-sora text-2xl tracking-widest text-white shadow-xl flex items-center justify-center gap-3 transition-transform uppercase hold-progress overflow-hidden relative ${
              pressedBtn === 'entry' ? 'scale-95 bg-emerald-700 shadow-none' : 'bg-accent-secondary hover:-translate-y-1'
            }`}
          >
            <span className="relative z-10">🏠 MARK ENTRY</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default GuardVerifyPage;
