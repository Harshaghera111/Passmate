import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle } from 'lucide-react';

const GuardInvalidPassPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-red-600 flex flex-col items-center justify-center p-6 page-enter z-50">
      <div className="flex flex-col items-center text-center max-w-sm w-full bg-red-700/50 p-8 rounded-[40px] border border-red-500 shadow-2xl backdrop-blur-sm">
        
        <div className="w-24 h-24 bg-white text-red-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,255,255,0.3)] animate-pulse">
           <X size={64} strokeWidth={3} />
        </div>

        <h1 className="text-4xl font-black font-sora text-white tracking-widest mb-4">INVALID PASS</h1>
        
        <div className="bg-red-800/80 px-4 py-3 rounded-xl border border-red-500/50 mb-8 w-full">
           <p className="text-white font-bold text-lg flex items-center justify-center gap-2">
             <AlertTriangle size={20} className="text-amber-400" /> Pass Already Used
           </p>
           <p className="text-red-200 text-sm mt-1">Exit was recorded at 2:05 PM</p>
        </div>

        <div className="w-full space-y-4">
          <button 
            onClick={() => navigate('/guard/home')}
            className="w-full h-16 bg-white text-red-600 font-black text-xl rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg"
          >
            DISMISS
          </button>
          <button className="w-full h-14 bg-transparent border-2 border-white/30 text-white font-bold text-lg rounded-2xl hover:bg-white/10 transition-colors">
            Report to Warden
          </button>
        </div>

      </div>
    </div>
  );
};

export default GuardInvalidPassPage;
