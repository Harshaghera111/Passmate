import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, ShieldCheck, AlertTriangle, Home, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { mockPasses } from '../../data/mockData';
import StatCard from '../../components/ui/StatCard';
import StatusPill from '../../components/ui/StatusPill';

const WardenDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Mock analytics
  const pendingRequests = mockPasses.filter(p => p.status === 'pending');
  const activeOut = mockPasses.filter(p => p.status === 'active');
  const lateReturns = mockPasses.filter(p => p.isLate);

  // Take the most urgent pending requests for the queue
  const priorityQueue = pendingRequests.slice(0, 5);

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-sora text-text-primary">
            Warden Dashboard
          </h1>
          <p className="text-text-muted mt-1">{user?.hostel} • {format(new Date(), 'EEEE, do MMMM yyyy')}</p>
        </div>
        <button 
          onClick={() => navigate('/warden/emergency')}
          className="btn btn-danger-outline shadow-sm bg-white"
        >
          <AlertTriangle size={16} /> Emergency Override
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending Requests" value={pendingRequests.length} icon={<Clock size={20} />} color="amber" onClick={() => navigate('/warden/requests')} />
        <StatCard label="Active Out" value={activeOut.length} icon={<Home size={20} />} color="blue" />
        <StatCard label="Expected Back Soon" value="12" icon={<ShieldCheck size={20} />} color="green" />
        <StatCard label="Late Returns" value={lateReturns.length} icon={<AlertTriangle size={20} />} color="red" trend={{value: 12, label: 'vs yesterday'}} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Priority Queue Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border flex justify-between items-center bg-gray-50/50">
            <h2 className="font-bold font-sora text-text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Priority Action Queue
            </h2>
            <button 
              onClick={() => navigate('/warden/requests')}
              className="text-xs font-semibold text-accent-primary hover:underline flex items-center"
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
                  <th>Parent Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {priorityQueue.map(pass => (
                  <tr key={pass.id}>
                    <td>
                      <div className="font-semibold text-text-primary">{pass.studentName}</div>
                      <div className="text-xs text-text-muted font-mono">{pass.usn}</div>
                    </td>
                    <td className="text-sm">{pass.room}</td>
                    <td className="max-w-[150px] truncate text-sm" title={pass.reasonDetail}>{pass.reasonDetail}</td>
                    <td className="text-sm">{format(new Date(pass.outTime), 'MMM d, h:mm a')}</td>
                    <td><StatusPill status={`parent_${pass.parentStatus}` as any} size="sm" pulse={false} /></td>
                    <td className="text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button className="btn btn-ghost px-2 py-1 text-xs hover:bg-red-50 hover:text-red-600 transition-colors">Reject</button>
                        <button className="btn btn-success px-3 py-1 text-xs hover:-translate-y-0.5 transition-transform shadow-sm btn-approve-pulse">Approve</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {priorityQueue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-text-muted text-sm">
                      No pending requests in the queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed Sidebar */}
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col">
          <div className="p-5 border-b border-border bg-gray-50/50">
            <h2 className="font-bold font-sora text-text-primary">Recent Gate Activity</h2>
          </div>
          <div className="p-5 flex-1 overflow-y-auto max-h-[400px] space-y-4">
            {mockPasses.filter(p => p.status === 'returned' || p.status === 'active').slice(0, 6).map(pass => (
              <div key={pass.id} className="flex gap-3 text-sm">
                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${pass.status === 'returned' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  {pass.status === 'returned' ? <ShieldCheck size={14} /> : <Clock size={14} />}
                </div>
                <div>
                  <p className="text-text-primary">
                    <span className="font-semibold">{pass.studentName}</span> {pass.status === 'returned' ? 'returned to campus' : 'exited campus'}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 font-mono">
                    {format(new Date(pass.status === 'returned' ? pass.actualReturn! : pass.exitScannedAt!), 'h:mm a')} • {pass.usn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default WardenDashboard;
