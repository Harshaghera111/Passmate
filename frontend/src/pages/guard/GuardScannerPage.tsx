import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X, Zap, ScanLine, ArrowRight, Hash } from 'lucide-react';
import { getPass } from '../../services/passService';

const GuardScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [torch,     setTorch]     = useState(false);
  const [manualId,  setManualId]  = useState('');
  const [searching, setSearching] = useState(false);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualId.trim();
    if (!trimmed) return;

    setSearching(true);
    try {
      const pass = await getPass(trimmed);
      if (!pass) {
        toast.error('No pass found with that ID. Check and try again.');
        return;
      }
      navigate(`/guard/verify/${trimmed}`);
    } catch (err) {
      toast.error('Failed to look up pass. Check the ID and try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col page-enter">

      {/* ── Top Bar ── */}
      <div className="flex justify-between items-center p-6 text-white pt-10">
        <button
          onClick={() => navigate('/guard/home')}
          className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md"
        >
          <X size={24} />
        </button>

        <span className="text-white font-bold text-sm tracking-widest uppercase opacity-70">Scanner</span>

        <button
          onClick={() => setTorch(!torch)}
          className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${torch ? 'bg-amber-400 text-black' : 'bg-black/50 text-white'}`}
        >
          <Zap size={24} className={torch ? 'fill-current' : ''} />
        </button>
      </div>

      {/* ── Viewfinder ── */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        <div className="relative w-[260px] h-[260px]">
          {/* Dark overlay corners */}
          <div className="absolute inset-0 border-[60px] border-black/60 -m-[60px] rounded-[60px]" />
          {/* Corner markers */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl scanner-corner" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl scanner-corner" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl scanner-corner" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-400 rounded-br-xl scanner-corner" />
          </div>
          {/* Scan line */}
          <div
            className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]"
            style={{ animation: 'scan 2.5s linear infinite' }}
          />
        </div>

        <div className="mt-10 flex flex-col items-center">
          <ScanLine size={28} className="text-white/50 mb-3 animate-pulse" />
          <h2 className="text-white font-bold font-sora text-xl tracking-wider">SCANNING</h2>
          <p className="text-white/60 text-sm mt-2 text-center max-w-[240px]">
            Point camera at the student's gate pass QR code
          </p>
        </div>
      </div>

      {/* ── Manual Pass ID Input ── */}
      <div className="bg-black/80 backdrop-blur-md border-t border-white/10 px-6 py-6">
        <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Hash size={12} /> Enter Pass ID Manually
        </p>
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Paste pass ID here..."
            value={manualId}
            onChange={e => setManualId(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm font-mono focus:outline-none focus:border-emerald-400 focus:bg-white/15 transition-all"
          />
          <button
            type="submit"
            disabled={!manualId.trim() || searching}
            className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 transition-colors"
          >
            {searching
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <ArrowRight size={20} />
            }
          </button>
        </form>
      </div>

    </div>
  );
};

export default GuardScannerPage;
