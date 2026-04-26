import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Search, Filter, ShieldCheck, X, Loader, CheckCircle2, XCircle, Download } from 'lucide-react';
import { subscribeAllPasses, wardenApprove, wardenReject, exportPassesCSV, type GatePass } from '../../services/passService';
import { useAuthStore } from '../../store/authStore';
import StatusPill from '../../components/ui/StatusPill';
import SidePanel from '../../components/ui/SidePanel';
import toast from 'react-hot-toast';

type TabType = 'pending' | 'approved' | 'rejected' | 'all';

const STATUS_PILL_MAP: Record<string, any> = {
  pending: 'pending',
  parent_approved: 'pending',
  parent_rejected: 'rejected',
  approved: 'approved',
  rejected: 'rejected',
  active: 'active',
  returned: 'returned',
  expired: 'expired',
};

const WardenRequestsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<TabType>('pending');
  const [search, setSearch] = useState('');
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    const unsub = subscribeAllPasses(data => {
      setPasses(data);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  const handleApprove = async () => {
    if (!selectedPass || !user) return;
    setActionLoading(true);
    try {
      await wardenApprove(selectedPass.id, user.uid, note);
      toast.success('Pass approved successfully!');
      setSelectedPass(null);
      setNote('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve pass');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPass || !user) return;
    setActionLoading(true);
    try {
      await wardenReject(selectedPass.id, user.uid, note);
      toast.success('Pass request rejected.');
      setSelectedPass(null);
      setNote('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject pass');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPasses = passes.filter(p => {
    if (tab === 'pending'  && !['pending', 'parent_approved'].includes(p.status)) return false;
    if (tab === 'approved' && !['approved', 'active', 'returned'].includes(p.status)) return false;
    if (tab === 'rejected' && !['rejected', 'parent_rejected'].includes(p.status)) return false;
    const q = search.toLowerCase();
    if (q && !(p.studentName || '').toLowerCase().includes(q) && !(p.usn || '').toLowerCase().includes(q)) return false;
    return true;
  });

  const pendingCount = passes.filter(p => ['pending', 'parent_approved'].includes(p.status)).length;

  return (
    <div className="space-y-6 page-enter h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold font-sora text-text-primary">Gate Pass Requests</h1>
          <p className="text-text-muted mt-1 text-sm">Real-time updates · {passes.length} total passes</p>
        </div>
        <button
          onClick={() => { exportPassesCSV(filteredPasses, `passes_${tab}_${format(new Date(), 'yyyy-MM-dd')}.csv`); toast.success('CSV downloaded!'); }}
          disabled={filteredPasses.length === 0}
          className="btn btn-secondary gap-2 h-10 px-4 text-sm disabled:opacity-50"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between gap-4 flex-shrink-0">
          <div className="flex gap-2 bg-bg-muted p-1 rounded-lg w-fit">
            {(['pending', 'approved', 'rejected', 'all'] as TabType[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                {t}
                {t === 'pending' && <span className="bg-amber-100 text-amber-700 ml-1 px-1.5 py-0.5 rounded text-[10px]">{pendingCount}</span>}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text" placeholder="Search USN or Name..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-input bg-white focus:border-accent-primary outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto relative">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="animate-spin text-accent-primary" size={32} />
            </div>
          ) : (
            <table className="data-table">
              <thead className="sticky top-0 bg-bg-muted z-10">
                <tr>
                  <th>Student</th>
                  <th>Room</th>
                  <th>Reason</th>
                  <th>Out Time</th>
                  <th>Parent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPasses.map(pass => (
                  <tr key={pass.id} onClick={() => setSelectedPass(pass)} className="cursor-pointer hover:bg-blue-50/50 transition-colors">
                    <td>
                      <div className="font-semibold text-text-primary">{pass.studentName ?? '—'}</div>
                      <div className="text-xs text-text-muted font-mono">{pass.usn ?? '—'}</div>
                    </td>
                    <td className="text-sm font-medium text-text-secondary">{pass.room ?? '—'}</td>
                    <td className="max-w-[200px]">
                      <div className="text-sm text-text-primary font-medium">{pass.reason}</div>
                      <div className="text-xs text-text-muted truncate" title={pass.reasonDetail}>{pass.reasonDetail}</div>
                    </td>
                    <td className="text-sm">{format(pass.outTime, 'MMM d, h:mm a')}</td>
                    <td>
                      {pass.parentApproved === null && <StatusPill status={'parent_pending' as any} size="sm" pulse={false} />}
                      {pass.parentApproved === true  && <StatusPill status={'parent_approved' as any} size="sm" pulse={false} />}
                      {pass.parentApproved === false && <StatusPill status={'parent_rejected' as any} size="sm" pulse={false} />}
                    </td>
                    <td><StatusPill status={STATUS_PILL_MAP[pass.status] ?? 'pending'} size="sm" /></td>
                  </tr>
                ))}
                {filteredPasses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <Filter size={32} className="mx-auto text-border mb-3" />
                      <h3 className="font-semibold text-text-primary">No requests found</h3>
                      <p className="text-sm text-text-muted mt-1">Try adjusting your search or filter tabs.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <SidePanel open={!!selectedPass} onClose={() => { setSelectedPass(null); setNote(''); }} title="Pass Details" width="w-[500px]">
        {selectedPass && (
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-4 bg-bg-base p-4 rounded-xl border border-border mb-6">
              <div className="w-14 h-14 bg-gradient-hero text-white rounded-full flex items-center justify-center font-bold text-xl shadow-inner shadow-black/20">
                {selectedPass.studentName?.[0] ?? 'S'}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-text-primary leading-tight">{selectedPass.studentName}</h2>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-1 font-mono">
                  <span>{selectedPass.usn}</span> • <span>{selectedPass.room}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Request Details</h3>
                <div className="bg-bg-base p-4 rounded-xl border border-border space-y-3 text-sm">
                  <div><span className="text-text-muted font-medium w-28 inline-block">Pass ID:</span> <span className="font-mono text-text-primary">{selectedPass.id}</span></div>
                  <div><span className="text-text-muted font-medium w-28 inline-block">Reason:</span> <span className="font-semibold text-text-primary">{selectedPass.reasonDetail}</span></div>
                  <div><span className="text-text-muted font-medium w-28 inline-block">Out Time:</span> <span className="font-semibold text-text-primary">{format(selectedPass.outTime, 'MMM d, yyyy – h:mm a')}</span></div>
                  <div><span className="text-text-muted font-medium w-28 inline-block">Return By:</span> <span className="font-semibold text-text-primary">{format(selectedPass.expectedReturn, 'MMM d, yyyy – h:mm a')}</span></div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Parent Approval</h3>
                <div className="bg-bg-base p-4 rounded-xl border border-border flex items-center gap-3">
                  {selectedPass.parentApproved === null  && <><span className="text-amber-600">⏳</span> <span className="text-sm text-amber-700 font-medium">Pending parent response</span></>}
                  {selectedPass.parentApproved === true  && <><CheckCircle2 size={18} className="text-emerald-500" /> <span className="text-sm text-emerald-700 font-medium">Approved by Parent</span></>}
                  {selectedPass.parentApproved === false && <><XCircle size={18} className="text-red-500" /> <span className="text-sm text-red-700 font-medium">Rejected by Parent</span></>}
                </div>
              </div>
            </div>

            {['pending', 'parent_approved'].includes(selectedPass.status) && (
              <div className="mt-6 pt-6 border-t border-border space-y-4 flex-shrink-0">
                <textarea
                  placeholder="Optional note for student..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full border border-border rounded-lg p-3 text-sm focus:border-accent-primary outline-none resize-none bg-bg-muted focus:bg-white transition-colors"
                  rows={2}
                />
                <div className="flex gap-3">
                  <button className="btn btn-danger-outline flex-1" onClick={handleReject} disabled={actionLoading}>
                    {actionLoading ? <Loader className="animate-spin" size={16} /> : <X size={16} />} Reject
                  </button>
                  <button className="btn btn-success flex-1 shadow-lg shadow-emerald-500/20" onClick={handleApprove} disabled={actionLoading}>
                    {actionLoading ? <Loader className="animate-spin" size={16} /> : <ShieldCheck size={16} />} Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </SidePanel>
    </div>
  );
};

export default WardenRequestsPage;
