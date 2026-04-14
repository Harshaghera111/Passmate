import React, { useEffect, useState } from 'react';
import { 
  Users, Ticket, AlertTriangle, ShieldAlert, Download, Clock
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import StatCard from '../../components/ui/StatCard';
import StatusPill from '../../components/ui/StatusPill';
import { adminApi, passApi, type Analytics, type GatePass } from '../../lib/api';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: any[], label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-border shadow-xl rounded-lg text-sm">
        <p className="font-bold text-text-primary mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
           <p key={index} className="flex justify-between gap-4 font-medium" style={{color: entry.color}}>
             <span>{entry.name}:</span>
             <span>{entry.value}</span>
           </p>
        ))}
      </div>
    );
  }
  return null;
};

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<Analytics | null>(null);
  const [liveStudents, setLiveStudents] = useState<GatePass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.analytics(),
      passApi.list({ status: 'active' }) // Active = Student is currently outside
    ])
    .then(([analyticsRes, passesRes]) => {
      setData(analyticsRes);
      setLiveStudents(passesRes);
    })
    .catch(err => {
      console.error(err);
      toast.error('Failed to load dashboard data');
    })
    .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted">Loading analytics...</div>;
  }

  // Fallbacks if data fails somewhat
  const kpis = data?.kpis || { totalStudents: 0, passesToday: 0, lateReturns: 0, highViolations: 0 };
  const dailyPassData = data?.dailyPassData || [];
  const statusBreakdown = data?.statusBreakdown || [];
  const reasonBreakdown = data?.reasonBreakdown || [];

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sora text-text-primary">System Analytics</h1>
          <p className="text-text-muted mt-1 text-sm">Overview of institutional gate pass metrics.</p>
        </div>
        <button className="btn btn-secondary shadow-sm bg-white" onClick={() => toast.success('Exporting report...')}>
          <Download size={16} /> Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={kpis.totalStudents} icon={<Users size={20} />} color="blue" />
        <StatCard label="Passes Today" value={kpis.passesToday} icon={<Ticket size={20} />} color="purple" />
        <StatCard label="Late Returns" value={kpis.lateReturns} icon={<AlertTriangle size={20} />} color="amber" />
        <StatCard label="High Violations (>3)" value={kpis.highViolations} icon={<ShieldAlert size={20} />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Daily Requests (Line Chart) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="font-bold text-text-primary font-sora mb-4">Daily Pass Requests (Recent)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyPassData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E5EC" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9BA3B2'}} dy={10} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9BA3B2'}} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" name="Approved" dataKey="approved" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                <Line type="monotone" name="Rejected" dataKey="rejected" stroke="#EF4444" strokeWidth={3} dot={false} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Students Outside Panel */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col max-h-[380px]">
          <h2 className="font-bold text-text-primary font-sora mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" /> Live Students Outside
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
             {liveStudents.length === 0 ? (
               <p className="text-sm text-text-muted text-center pt-8">No students currently outside.</p>
             ) : liveStudents.map(student => {
                const isLate = new Date() > new Date(student.expected_return || student.expectedReturn || '');
                return (
                   <div key={student.id} className={`p-3 rounded-xl border flex flex-col gap-1 transition-colors ${isLate ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex justify-between items-start">
                         <div className="flex flex-col gap-0.5">
                           <span className="font-bold text-sm text-text-primary">{student.studentName}</span>
                           <span className="text-xs font-mono text-text-secondary">{student.usn}</span>
                         </div>
                         <StatusPill status={`parent_${student.parent_status || student.parentStatus}` as any} size="sm" pulse={false} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                         <Clock size={12} /> Out since: {new Date(student.out_time || student.outTime || '').toLocaleTimeString(undefined, {hour:'numeric', minute:'numeric'})}
                      </div>
                      {isLate && (
                         <div className="text-xs font-bold text-red-600 mt-1 flex items-center gap-1">
                            <AlertTriangle size={12} /> LATE - Expected back: {new Date(student.expected_return || student.expectedReturn || '').toLocaleTimeString(undefined, {hour:'numeric', minute:'numeric'})}
                         </div>
                      )}
                   </div>
                );
             })}
          </div>
          <div className="pt-4 mt-2 border-t border-border flex justify-between items-center">
             <span className="text-xs font-semibold text-text-muted">Total Outside</span>
             <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{liveStudents.length}</span>
          </div>
        </div>

        {/* Chart 2: Status Breakdown (Donut Chart) */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col justify-between">
          <h2 className="font-bold text-text-primary font-sora mb-4">Current System State</h2>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#9BA3B2'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {statusBreakdown.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}} />
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{item.name}</p>
                  <p className="font-semibold text-text-primary text-sm">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Reasons (Bar Chart) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="font-bold text-text-primary font-sora mb-4">Top Pass Reasons</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonBreakdown} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E5EC" />
                <XAxis type="number" hide />
                <YAxis dataKey="reason" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#5A6173'}} width={90} />
                <Tooltip cursor={{fill: '#F7F8FA'}} content={<CustomTooltip />} />
                <Bar dataKey="count" name="Total Passes" fill="#2F6FED" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
