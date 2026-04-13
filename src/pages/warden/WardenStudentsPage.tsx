import React, { useState } from 'react';
import { Search, Filter, AlertTriangle } from 'lucide-react';
import { mockStudents } from '../../data/mockData';

const WardenStudentsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredStudents = mockStudents.filter(s => 
    !search || 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.usn.toLowerCase().includes(search.toLowerCase()) ||
    s.room.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 page-enter h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold font-sora text-text-primary">Student Directory</h1>
          <p className="text-text-muted mt-1 text-sm">Manage hostel residents, view pass history and violations.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
        {/* Header/Controls */}
        <div className="p-4 border-b border-border flex justify-between gap-4 flex-shrink-0 bg-gray-50/50">
          <div className="relative max-w-sm w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search by Name, USN, Room..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-input bg-white focus:border-accent-primary outline-none"
            />
          </div>
          <button className="btn btn-secondary px-3 py-2 text-sm bg-white">
             <Filter size={14} /> Filter
          </button>
        </div>

        {/* Directory Table */}
        <div className="flex-1 overflow-auto">
          <table className="data-table">
            <thead className="sticky top-0 bg-bg-muted z-10">
              <tr>
                <th>Student</th>
                <th>Room</th>
                <th>Branch/Yr</th>
                <th>Contact</th>
                <th>Parent Contact</th>
                <th className="text-center">Passes</th>
                <th className="text-center">Violations</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id} className="cursor-pointer hover:bg-bg-muted transition-colors">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-blue-500/20">
                        {student.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">{student.name}</div>
                        <div className="text-xs text-text-muted font-mono">{student.usn}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm font-medium">{student.room} <span className="text-xs text-text-muted">({student.block})</span></td>
                  <td className="text-sm">{student.branch} - {student.year} Yr</td>
                  <td className="text-sm font-mono">+91 {student.mobile}</td>
                  <td className="text-sm font-mono">+91 {student.parentMobile}</td>
                  <td className="text-center">
                    <span className="font-bold text-text-primary bg-bg-base px-2 py-1 rounded border border-border">{student.totalPasses}</span>
                  </td>
                  <td className="text-center">
                    {student.violations > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200">
                        <AlertTriangle size={12} /> {student.violations}
                      </span>
                    ) : (
                      <span className="text-text-muted font-semibold">—</span>
                    )}
                  </td>
                  <td>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-200">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WardenStudentsPage;
