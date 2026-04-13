import React, { useState } from 'react';
import { format } from 'date-fns';
import { Download, Search, Filter } from 'lucide-react';
import { mockActivityLogs } from '../../data/mockData';
import RoleBadge from '../../components/ui/RoleBadge';

const AdminLogsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredLogs = mockActivityLogs.filter(log => 
    !search || 
    log.actor.toLowerCase().includes(search.toLowerCase()) || 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 page-enter h-[calc(100vh-100px)] flex flex-col max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold font-sora text-text-primary">Audit Logs</h1>
          <p className="text-text-muted mt-1 text-sm">Chronological record of all system events and actions.</p>
        </div>
        <button className="btn btn-secondary shadow-sm bg-white">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-border flex justify-between gap-4 flex-shrink-0 bg-gray-50/50">
          <div className="relative max-w-sm w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search actor, action, or entity ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-input bg-white focus:border-accent-primary outline-none"
            />
          </div>
          <button className="btn btn-secondary px-3 py-2 text-sm bg-white">
             <Filter size={14} /> Filters
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="data-table">
            <thead className="sticky top-0 bg-bg-muted z-10">
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action Taken</th>
                <th>Entity / Target</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-bg-muted transition-colors text-sm">
                  <td className="whitespace-nowrap text-text-primary font-medium">{format(new Date(log.timestamp), 'MMM d, yy • HH:mm:ss')}</td>
                  <td className="font-semibold text-text-primary">{log.actor}</td>
                  <td><RoleBadge role={log.role} /></td>
                  <td className="font-mono text-xs font-semibold text-accent-primary bg-blue-50/50 px-2 py-1 rounded inline-block mt-1.5 border border-blue-100">
                     {log.action}
                  </td>
                  <td className="font-mono text-text-secondary text-xs">{log.entity}</td>
                  <td className="font-mono text-text-muted text-xs">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLogsPage;
