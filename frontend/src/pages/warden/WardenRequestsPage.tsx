import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Search, Filter, ShieldCheck, X, Loader } from 'lucide-react';
import { passApi, type GatePass } from '../../lib/api';
import SidePanel from '../../components/ui/SidePanel';
import toast from 'react-hot-toast';

type TabType = 'pending' | 'approved' | 'rejected' | 'all';

const WardenRequestsPage: React.FC = () => {
  const [tab, setTab] = useState<TabType>('pending');
  const [search, setSearch] = useState('');
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPasses = async () => {
    try {
      const data = await passApi.list();
      setPasses(data);
    } catch (err) {
      console.error('Failed to fetch passes', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const handleApprove = async () => {
    if (!selectedPass) return;
    setActionLoading(true);
    try {
      await passApi.wardenApprove(selectedPass.id);
      setSelectedPass(null);
      toast.success('Pass approved successfully!');
      fetchPasses();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to approve pass');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPass) return;
    setActionLoading(true);
    try {
      await passApi.wardenReject(selectedPass.id);
      setSelectedPass(null);
      toast.success('Pass request rejected.');
      fetchPasses();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to reject pass');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPasses = passes.filter(p => {
    if (tab === 'pending' && p.status !== 'pending') return false;
    if (tab === 'approved' && p.status !== 'approved' && p.status !== 'active' && p.status !== 'returned') return false;
    if (tab === 'rejected' && p.status !== 'rejected') return false;
    if (search && !(p.studentName || '').toLowerCase().includes(search.toLowerCase()) && !(p.usn || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 page-enter h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold font-sora text-text-primary">Gate Pass Requests</h1>
          <p className="text-text-muted mt-1 text-sm">Review, approve, and manage all student gate passes.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
        
        {/* Filters Header */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between gap-4 flex-shrink-0">
          <div className="flex gap-2 bg-bg-muted p-1 rounded-lg w-fit">
             {(['pending', 'approved', 'rejected', 'all'] as TabType[]).map(t => (
               <button
                 key={t}
                 onClick={() => setTab(t)}
                 className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
               >
                 {t} {t === 'pending' && <span className="bg-amber-100 text-amber-700 ml-1 px-1.5 py-0.5 rounded text-[10px]">{(passes.filter(p => p.status==='pending')).length}</span>}
               </button>
             ))}
          </div>

          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search USN or Name..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-input bg-white focus:border-accent-primary outline-none"
            />
          </div>
        </div>

        {/* Table Content */}
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
                  <th>Parent Status</th>
                  <th>Warden Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPasses.map(pass => (
                  <tr 
                    key={pass.id} 
                    onClick={() => setSelectedPass(pass)}
                    className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                  >
                    <td>
                      <div className="font-semibold text-text-primary">{pass.studentName}</div>
                      <div className="text-xs text-text-muted font-mono">{pass.usn}</div>
                    </td>
                    <td className="text-sm font-medium text-text-secondary">{pass.room}</td>
                    <td className="max-w-[200px]">
                       <div className="text-sm text-text-primary font-medium">{pass.reason}</div>
                       <div className="text-xs text-text-muted truncate" title={pass.reason_detail || pass.reasonDetail}>{pass.reason_detail || pass.reasonDetail}</div>
                    </td>
                    <td className="text-sm">{format(new Date(pass.out_time || pass.outTime || new Date()), 'MMM d, h:mm a')}</td>
                    <td><StatusPill status={`parent_${pass.parent_status || pass.parentStatus}` as any} size="sm" pulse={false} /></td>
                    <td><StatusPill status={pass.status} size="sm" /></td>
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

      {/* Detail Slide Panel */}
      <SidePanel 
        open={!!selectedPass} 
        onClose={() => setSelectedPass(null)}
        title="Pass Details"
        width="w-[500px]"
      >
        {selectedPass && (
          <div className="p-6 flex flex-col h-full">
            
            {/* Student Header Card */}
            <div className="flex items-center gap-4 bg-bg-base p-4 rounded-xl border border-border mb-6">
              <div className="w-14 h-14 bg-gradient-hero text-white rounded-full flex items-center justify-center font-bold text-xl shadow-inner shadow-black/20">
                {selectedPass.studentName?.[0] || 'S'}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-text-primary leading-tight">{selectedPass.studentName}</h2>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-1 font-mono">
                  <span>{selectedPass.usn}</span> • <span>{selectedPass.room}</span> • <span>{selectedPass.block}</span>
                </div>
              </div>
              <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-100 text-center">
                 <div className="text-[10px] font-bold uppercase tracking-wider">Violations</div>
                 <div className="text-xl font-bold font-mono">0</div>
              </div>
            </div>

            {/* Pass details */}
            <div className="space-y-6 flex-1">
               <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Request Details</h3>
                  <div className="bg-bg-base p-4 rounded-xl border border-border space-y-4 text-sm">
                    <div>
                      <span className="text-text-muted font-medium w-24 inline-block">Req ID:</span>
                      <span className="font-mono text-text-primary">{selectedPass.id}</span>
                    </div>
                    <div>
                      <span className="text-text-muted font-medium w-24 inline-block">Reason:</span>
                      <span className="font-semibold text-text-primary">{selectedPass.reason_detail || selectedPass.reasonDetail}</span>
                    </div>
                    <div>
                      <span className="text-text-muted font-medium w-24 inline-block">Out Time:</span>
                      <span className="font-semibold text-text-primary">{format(new Date(selectedPass.out_time || selectedPass.outTime || new Date()), 'MMM d, yyyy - h:mm a')}</span>
                    </div>
                    <div>
                      <span className="text-text-muted font-medium w-24 inline-block">Expected:</span>
                      <span className="font-semibold text-text-primary">{format(new Date(selectedPass.expected_return || selectedPass.expectedReturn || new Date()), 'MMM d, yyyy - h:mm a')}</span>
                    </div>
                  </div>
               </div>

               <div>
                 <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Parent Approval Status</h3>
                 <div className="bg-bg-base p-4 rounded-xl border border-border flex items-center justify-between">
                   <StatusPill status={`parent_${selectedPass.parent_status || selectedPass.parentStatus}` as any} />
                   {(selectedPass.parent_approved_at || selectedPass.parentApprovedAt) && (
                     <span className="text-xs text-text-muted font-mono">{format(new Date(selectedPass.parent_approved_at || selectedPass.parentApprovedAt!), 'h:mm a')}</span>
                   )}
                 </div>
               </div>

               {selectedPass.status !== 'pending' && (
                 <div>
                   <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Current Status</h3>
                   <div className="bg-bg-base p-4 rounded-xl border border-border flex items-center justify-between">
                     <StatusPill status={selectedPass.status} />
                     <span className="text-xs text-text-muted font-mono">{selectedPass.exit_scanned_at || selectedPass.exitScannedAt ? 'Exited' : 'No Exit recorded'}</span>
                   </div>
                 </div>
               )}
            </div>

            {/* Action Bar at bottom */}
            {selectedPass.status === 'pending' && (
              <div className="mt-6 pt-6 border-t border-border space-y-4 flex-shrink-0 bg-white">
                <textarea 
                  placeholder="Optional note for student..."
                  className="w-full border border-border rounded-lg p-3 text-sm focus:border-accent-primary outline-none resize-none bg-bg-muted focus:bg-white transition-colors"
                  rows={2}
                />
                <div className="flex gap-3">
                  <button className="btn btn-danger-outline flex-1 group" onClick={handleReject} disabled={actionLoading}>
                    {actionLoading ? <Loader className="animate-spin" size={16} /> : <X size={16} />} Reject Request
                  </button>
                  <button className="btn btn-success flex-1 shadow-lg shadow-emerald-500/20 group hover:-translate-y-0.5 btn-approve-pulse" onClick={handleApprove} disabled={actionLoading}>
                    {actionLoading ? <Loader className="animate-spin" size={16} /> : <ShieldCheck size={16} />} Approve Pass
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
