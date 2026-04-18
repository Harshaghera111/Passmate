import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X, Zap, ScanLine } from 'lucide-react';

const GuardScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    // For demo: find a real approved/active pass via Firestore
    const findPass = async () => {
      try {
        const { listPasses } = await import('../../services/passService');
        const passes = await listPasses();
        const scannable = passes.find(p => p.status === 'approved' || p.status === 'active');
        if (scannable) {
          setTimeout(() => navigate(`/guard/verify/${scannable.id}`), 2500);
        } else {
          toast.error('No approved passes available to scan.');
          setTimeout(() => navigate('/guard/home'), 2500);
        }
      } catch (err) {
        toast.error('Failed to initialize scanner');
      }
    };
    findPass();
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col page-enter">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-6 text-white pt-10">
        <button onClick={() => navigate('/guard/home')} className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md">
          <X size={24} />
        </button>
        <button
          onClick={() => setTorch(!torch)}
          className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${torch ? 'bg-amber-400 text-black' : 'bg-black/50 text-white'}`}
        >
          <Zap size={24} className={torch ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-20">
        <div className="relative w-[280px] h-[280px]">
          <div className="absolute inset-0 border-[60px] border-black/60 -m-[60px] rounded-[60px]" />
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl scanner-corner" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl scanner-corner" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl scanner-corner" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-400 rounded-br-xl scanner-corner" />
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)] animate-scan" style={{ animationDuration: '2.5s' }} />
        </div>

        <div className="mt-16 flex flex-col items-center">
          <ScanLine size={32} className="text-white/50 mb-4 animate-pulse" />
          <h2 className="text-white font-bold font-sora text-xl tracking-wider">SCANNING</h2>
          <p className="text-white/60 text-sm mt-2 text-center max-w-[240px]">
            Point camera at the student's gate pass QR code to verify
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuardScannerPage;
