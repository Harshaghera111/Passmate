import React from 'react';
import { 
  Users, Ticket, AlertTriangle, ShieldAlert, Download
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import StatCard from '../../components/ui/StatCard';
import { 
  dailyPassData, statusBreakdown, reasonBreakdown, exitHeatmap 
} from '../../data/mockData';

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

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sora text-text-primary">System Analytics</h1>
          <p className="text-text-muted mt-1 text-sm">Overview of institutional gate pass metrics.</p>
        </div>
        <button className="btn btn-secondary shadow-sm bg-white">
          <Download size={16} /> Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value="4,250" icon={<Users size={20} />} color="blue" />
        <StatCard label="Passes Today" value="142" icon={<Ticket size={20} />} color="purple" trend={{value: 12, label: 'vs yesterday'}} />
        <StatCard label="Late Returns (MTD)" value="24" icon={<AlertTriangle size={20} />} color="amber" trend={{value: -5, label: 'vs last month'}} />
        <StatCard label="High Violations" value="8" icon={<ShieldAlert size={20} />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Daily Requests (Line Chart) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="font-bold text-text-primary font-sora mb-4">Daily Pass Requests (30 Days)</h2>
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

        {/* Chart 2: Status Breakdown (Donut Chart) */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col justify-between">
          <h2 className="font-bold text-text-primary font-sora mb-4">Pass Status Distribution</h2>
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
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
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

        {/* Chart 4: Exit Heatmap */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="font-bold text-text-primary font-sora mb-2">Gate Exit Heatmap</h2>
          <p className="text-xs text-text-muted mb-6">Identifies peak traffic hours at security gates.</p>
          
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="text-xs font-bold text-text-muted uppercase text-right pr-4">Hour</div>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="text-xs font-bold text-text-muted text-center uppercase">{d}</div>
                ))}
              </div>
              {exitHeatmap.map((row, i) => (
                <div key={i} className="grid grid-cols-8 gap-2 mb-2 items-center">
                  <div className="text-xs font-semibold text-text-secondary text-right pr-4">{row.hour}</div>
                  {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => {
                    const val = (row as Record<string, any>)[day] as number;
                    // basic color scale
                    const opacity = val === 0 ? 0 : val < 4 ? 0.3 : val < 8 ? 0.6 : val < 12 ? 0.8 : 1;
                    return (
                       <div 
                         key={day} 
                         className="h-8 rounded-md flex items-center justify-center text-xs font-medium text-white transition-all hover:scale-110 cursor-pointer"
                         style={{ backgroundColor: `rgba(47,111,237,${opacity})`, color: val < 4 ? '#5A6173' : 'white' }}
                         title={`${val} exits on ${day.toUpperCase()} at ${row.hour}`}
                       >
                         {val > 0 ? val : ''}
                       </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
