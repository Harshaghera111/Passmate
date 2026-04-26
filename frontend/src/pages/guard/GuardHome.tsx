import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, ArrowRightLeft, LogOut, Loader } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { subscribeAllPasses } from '../../services/passService';

const GuardHome: React.FC = () => {
  const { user: authUser, logout: authLogout } = useAuthStore();
  const navigate = useNavigate();

  const [exitsToday,   setExitsToday]   = useState(0);
  const [entriesToday, setEntriesToday] = useState(0);
  const [isLoading,    setIsLoading]    = useState(true);

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  // ── Real-time stats from Firestore ────────────────────────────────────────
  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const unsub = subscribeAllPasses((passes) => {
      const exits   = passes.filter(p => p.exitTime  && new Date(p.exitTime)  >= todayStart).length;
      const entries = passes.filter(p => p.entryTime && new Date(p.entryTime) >= todayStart).length;
      setExitsToday(exits);
      setEntriesToday(entries);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col page-enter pb-6 max-w-lg mx-auto">

      {/* ── Header Profile ── */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex flex-shrink-0 items-center justify-center font-bold text-lg border-2 border-amber-200">
            {authUser?.name?.[0]?.toUpperCase() ?? 'G'}
          </div>
          <div>
            <h1 className="font-bold text-text-primary text-lg leading-tight">{authUser?.name ?? 'Guard'}</h1>
            <p className="text-xs text-text-muted font-medium">Security Personnel</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* ── Giant Scan Button ── */}
      <div className="flex-1 flex flex-col justify-center items-center py-10">
        <button
          onClick={() => navigate('/guard/scanner')}
          className="relative w-64 h-64 rounded-full bg-accent-primary text-white flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(47,111,237,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 group"
        >
          {/* Animated rings */}
          <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '1.5s' }} />

          <ScanLine size={80} strokeWidth={1.5} className="mb-4 group-hover:scale-110 transition-transform duration-300" />
          <span className="font-bold font-sora text-xl tracking-wide">SCAN QR</span>
          <span className="text-blue-200 text-xs font-medium mt-1">Tap to open scanner</span>
        </button>
      </div>

      {/* ── Daily Stats ── */}
      <div className="grid grid-cols-2 gap-4 mt-auto">
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl text-center">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
            <ArrowRightLeft size={14} className="rotate-45" /> Exits Today
          </p>
          {isLoading ? (
            <Loader size={24} className="mx-auto animate-spin text-blue-400" />
          ) : (
            <p className="text-4xl font-black font-sora text-blue-700">{exitsToday}</p>
          )}
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-center">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
            <ArrowRightLeft size={14} className="-rotate-45" /> Entries Today
          </p>
          {isLoading ? (
            <Loader size={24} className="mx-auto animate-spin text-emerald-400" />
          ) : (
            <p className="text-4xl font-black font-sora text-emerald-700">{entriesToday}</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default GuardHome;
