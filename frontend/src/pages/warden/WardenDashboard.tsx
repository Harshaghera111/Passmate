import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Clock, ShieldCheck, AlertTriangle, Home,
  ChevronRight, CheckCircle2, XCircle, Loader,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import {
  subscribeAllPasses, wardenApprove, wardenReject,
  type GatePass,
} from '../../services/passService';
import StatCard from '../../components/ui/StatCard';
import StatusPill from '../../components/ui/StatusPill';
import toast from 'react-hot-toast';

const WardenDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate  = useNavigate();

  const [passes,        setPasses]        = useState<GatePass[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // passId being actioned

  // ── Real-time Firestore subscription ─────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeAllPasses((data) => {
      setPasses(data);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────────
  const handleApprove = async (pass: GatePass) => {
    if (!user) return;
    setActionLoading(pass.id);
    try {
      await wardenApprove(pass.id, user.uid);
      toast.success(`Pass approved for ${pass.studentName ?? 'student'}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve pass');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (pass: GatePass) => {
    if (!user) return;
    setActionLoading(pass.id);
    try {
      await wardenReject(pass.id, user.uid);
      toast.success('Pass request rejected.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject pass');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────────
  const pendingPasses  = passes.filter(p => ['pending', 'parent_approved'].includes(p.status));
  const activeOut      = passes.filter(p => p.status === 'active');
  const lateReturns    = passes.filter(p => p.isLate);
  const recentActivity = passes.filter(p => ['returned', 'active'].includes(p.status)).slice(0, 6);

  // Top 5 priority queue (pending ones first)
  const priorityQueue = pendingPasses.slice(0, 5);

  return (
    <div className="space-y-6 page-enter">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-sora text-text-primary">
            Warden Dashboard
          </h1>
          <p className="text-text-muted mt-1">
            {user?.hostel ?? 'Hostel'} · {format(new Date(), 'EEEE, do MMMM yyyy')}
          </p>
        </div>
        <button
          onClick={() => navigate('/warden/emergency')}
          className="btn btn-danger-outline shadow-sm bg-white"
        >
          <AlertTriangle size={16} /> Emergency Override
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="animate-spin text-accent-primary" size={32} />
        </div>
      ) : (
        <>
          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Pending Requests"
              value={pendingPasses.length}
              icon={<Clock size={20} />}
              color="amber"
              onClick={() => navigate('/warden/requests')}
            />
            <StatCard label="Active Out"        value={activeOut.length}   icon={<Home size={20} />}         color="blue"  />
            <StatCard label="Approved Today"    value={passes.filter(p => p.status === 'approved' || p.status === 'returned').length} icon={<ShieldCheck size={20} />}  color="green" />
            <StatCard label="Late Returns"      value={lateReturns.length} icon={<AlertTriangle size={20} />} color="red"   />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* ── Priority Queue Table ── */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-border flex justify-between items-center bg-gray-50/50">
                <h2 className="font-bold font-sora text-text-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Priority Action Queue
                  {pendingPasses.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-badge font-bold">
                      {pendingPasses.length}
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => navigate('/warden/requests')}
                  className="text-xs font-semibold text-accent-primary hover:underline flex items-center gap-0.5"
                >
                  View All <ChevronRight size={14} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student Info</th>
                      <th>Room</th>
                      <th>Reason</th>
                      <th>Out Time</th>
                      <th>Parent</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priorityQueue.map(pass => {
                      const isActioning = actionLoading === pass.id;
                      return (
                        <tr key={pass.id} className="hover:bg-blue-50/30 transition-colors">
                          <td>
                            <div className="font-semibold text-text-primary">{pass.studentName ?? '—'}</div>
                            <div className="text-xs text-text-muted font-mono">{pass.usn ?? '—'}</div>
                          </td>
                          <td className="text-sm">{pass.room ?? '—'}</td>
                          <td className="max-w-[150px] text-sm">
                            <div className="font-medium text-text-primary truncate">{pass.reason}</div>
                            <div className="text-xs text-text-muted truncate" title={pass.reasonDetail}>{pass.reasonDetail}</div>
                          </td>
                          <td className="text-sm whitespace-nowrap">{format(pass.outTime, 'MMM d, h:mm a')}</td>
                          <td>
                            {pass.parentApproved === null  && <StatusPill status={'parent_pending'  as any} size="sm" pulse={false} />}
                            {pass.parentApproved === true  && <StatusPill status={'parent_approved' as any} size="sm" pulse={false} />}
                            {pass.parentApproved === false && <StatusPill status={'parent_rejected' as any} size="sm" pulse={false} />}
                          </td>
                          <td className="text-right whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleReject(pass)}
                                disabled={isActioning}
                                className="btn btn-ghost px-2 py-1 text-xs hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                              >
                                {isActioning ? <Loader size={12} className="animate-spin" /> : <XCircle size={14} />}
                                Reject
                              </button>
                              <button
                                onClick={() => handleApprove(pass)}
                                disabled={isActioning}
                                className="btn btn-success px-3 py-1 text-xs shadow-sm disabled:opacity-50"
                              >
                                {isActioning ? <Loader size={12} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {priorityQueue.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-10">
                          <ShieldCheck size={28} className="mx-auto text-emerald-400 mb-2" />
                          <p className="text-text-muted text-sm font-medium">All clear! No pending requests.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Recent Activity Feed ── */}
            <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col">
              <div className="p-5 border-b border-border bg-gray-50/50">
                <h2 className="font-bold font-sora text-text-primary">Recent Gate Activity</h2>
              </div>
              <div className="p-5 flex-1 overflow-y-auto max-h-[400px] space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-8">No recent gate activity.</p>
                ) : (
                  recentActivity.map(pass => (
                    <div key={pass.id} className="flex gap-3 text-sm">
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        pass.status === 'returned' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {pass.status === 'returned' ? <ShieldCheck size={14} /> : <Clock size={14} />}
                      </div>
                      <div>
                        <p className="text-text-primary">
                          <span className="font-semibold">{pass.studentName}</span>{' '}
                          {pass.status === 'returned' ? 'returned to campus' : 'exited campus'}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5 font-mono">
                          {format(pass.createdAt, 'h:mm a')} · Room {pass.room ?? '—'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default WardenDashboard;
