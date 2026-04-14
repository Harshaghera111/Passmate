import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Clock, QrCode, ArrowRight, ShieldCheck, User, History as HistoryIcon, Loader } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { passApi, GatePass } from '../../lib/api';
import StatCard from '../../components/ui/StatCard';
import StatusPill from '../../components/ui/StatusPill';

const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPasses = async () => {
      try {
        const data = await passApi.list();
        setPasses(data);
      } catch (err) {
        console.error('Failed to fetch passes:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPasses();
  }, []);
  
  // Find active or pending pass
  const activePass = passes.find(p => ['active', 'approved'].includes(p.status));
  const pendingPass = activePass ? null : passes.find(p => ['pending'].includes(p.status));
  const myPasses = passes.slice(0, 4); // Recent 4

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-sora text-text-primary">
            Good morning, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-text-muted mt-1">{format(new Date(), 'EEEE, do MMMM yyyy')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="animate-spin text-accent-primary" size={32} />
        </div>
      ) : (
        <>
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Active Pass & Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Pass Hero Card */}
          {activePass ? (
            <div 
              onClick={() => navigate(`/student/pass/${activePass.id}`)}
              className="bg-gradient-card rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl cursor-pointer hover:shadow-2xl transition-all group"
            >
              {/* Background decors */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 right-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <QrCode size={180} />
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-white/20 text-white backdrop-blur-md px-3 py-1 rounded-badge text-xs font-bold uppercase tracking-wider border border-white/20 shadow-sm">
                      {activePass.status === 'active' ? 'Currently Out' : 'Approved, Not Exited'}
                    </span>
                    <span className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-badge text-xs font-mono border border-white/10">
                      {activePass.id}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold font-sora mb-1">Gate Pass Ready</h2>
                  <p className="text-blue-100 mb-6 max-w-sm">Tap here to view your QR code and scan at the security gate.</p>
                  
                  <div className="flex items-center gap-2 text-sm font-medium bg-white/10 w-fit px-4 py-2 rounded-xl backdrop-blur-md border border-white/20">
                    <Clock size={16} className="text-blue-200" />
                    <span>Valid until: {format(new Date(activePass.expected_return || activePass.expectedReturn), 'MMM d, h:mm a')}</span>
                  </div>
                </div>
                
                {/* QR Thumbnail */}
                <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <QrCode size={64} className="text-text-primary" />
                </div>
              </div>
            </div>
          ) : pendingPass ? (
            <div 
              onClick={() => navigate('/student/history')}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-6 relative overflow-hidden cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 status-pending">
                  <Clock size={24} className="text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold font-sora text-amber-900">Pass under review</h3>
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-badge text-[10px] font-bold uppercase tracking-wider">Pending</span>
                  </div>
                  <p className="text-amber-700 text-sm max-w-md">Your pass request is currently waiting for approval.</p>
                  
                  <div className="mt-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${(pendingPass.parent_status || pendingPass.parentStatus) === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {(pendingPass.parent_status || pendingPass.parentStatus) === 'approved' ? <ShieldCheck size={14} /> : <Clock size={14} />}
                      </div>
                      <span className={(pendingPass.parent_status || pendingPass.parentStatus) === 'approved' ? 'text-emerald-700 font-medium' : 'text-amber-700'}>Parent Approval</span>
                    </div>
                    <div className="hidden sm:block text-amber-300">→</div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                         <Clock size={14} />
                      </div>
                      <span className="text-amber-700">Warden Approval</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-border shadow-sm text-center">
              <div className="w-16 h-16 bg-blue-50 text-accent-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode size={32} />
              </div>
              <h3 className="text-xl font-bold font-sora text-text-primary mb-2">No Active Gate Pass</h3>
              <p className="text-text-muted mb-6 max-w-sm mx-auto">You don't have any active or pending passes. Planning to go out?</p>
              <button 
                onClick={() => navigate('/student/request/new')}
                className="btn btn-primary h-12 px-8 shadow-md hover:shadow-lg transition-all group"
              >
                <Plus size={18} />
                <span>Request Gate Pass</span>
                <ArrowRight size={18} className="ml-1 opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
              </button>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard label="Total Passes" value={passes.length} icon={<HistoryIcon size={20} />} color="blue" />
            <StatCard label="On Time Returns" value={user?.user?.on_time_returns || 10} icon={<ShieldCheck size={20} />} color="green" trend={{value: 83, label: 'success rate'}} />
            <div className="col-span-2 sm:col-span-1 border border-border rounded-card bg-bg-muted/50 p-5 flex flex-col justify-center items-center text-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2">
                <User size={18} className="text-text-secondary" />
              </div>
              <p className="font-semibold text-text-primary">{user?.room}</p>
              <p className="text-xs text-text-muted">{user?.hostel}</p>
            </div>
          </div>

        </div>

        {/* Right Column - Activity Feed */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border flex justify-between items-center bg-gray-50/50">
            <h3 className="font-semibold font-sora text-text-primary">Recent Activity</h3>
            <button 
              onClick={() => navigate('/student/history')}
              className="text-xs font-semibold text-accent-primary hover:underline"
            >
              View All
            </button>
          </div>
          
          <div className="p-5 flex-1 relative">
            {/* Timeline line */}
            {myPasses.length > 0 && <div className="absolute left-[33px] top-6 bottom-6 w-px bg-border z-0" />}
            
            <div className="space-y-6 relative z-10">
              {myPasses.length === 0 ? (
                <p className="text-sm text-text-muted text-center pt-10">No recent activity.</p>
              ) : myPasses.map((pass) => (
                <div key={pass.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white border border-border flex flex-col items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    {pass.status === 'returned' ? <ShieldCheck size={14} className="text-emerald-500" /> :
                     pass.status === 'rejected' ? <span className="text-red-500 font-bold text-xs">X</span> :
                     pass.status === 'active' ? <Clock size={14} className="text-accent-primary" /> :
                     <div className="w-2 h-2 rounded-full bg-border" />}
                  </div>
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-semibold text-text-primary">{pass.title || pass.reason_detail || pass.reasonDetail}</p>
                    </div>
                    <p className="text-xs text-text-muted mb-2">{format(new Date(pass.created_at || pass.createdAt || new Date()), 'MMM d, h:mm a')}</p>
                    <StatusPill status={pass.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
