import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Filter, Mail, ShieldCheck } from 'lucide-react';
import { mockStudents } from '../../data/mockData';

const AdminViolationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'severe'>('all');

  // Find students with violations or late returns
  const violators = mockStudents.filter(s => s.violations > 0 || (s.totalPasses > s.onTimeReturns));
  
  const filteredViolators = violators.filter(v => {
    if (filter === 'severe') return v.violations >= 3;
    return true;
  }).sort((a, b) => b.violations - a.violations); // Sort by severity

  return (
    <div className="space-y-6 page-enter max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold font-sora text-text-primary">Violation Reports</h1>
          <p className="text-text-muted mt-1 text-sm">Monitor students with repeated late returns or disciplinary issues.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
        
        {/* Controls */}
        <div className="p-4 border-b border-border flex justify-between gap-4 flex-shrink-0 bg-gray-50/50">
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${filter === 'all' ? 'bg-white text-text-primary shadow-sm border border-border' : 'text-text-secondary hover:text-text-primary border border-transparent'}`}
            >
              All Violators
            </button>
            <button 
              onClick={() => setFilter('severe')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${filter === 'severe' ? 'bg-red-50 text-red-700 shadow-sm border border-red-200' : 'text-text-secondary hover:text-red-600 border border-transparent'}`}
            >
              <ShieldAlert size={14} className={filter === 'severe' ? 'text-red-500' : ''} /> Severe (3+ Warning)
            </button>
          </div>
          <button className="btn btn-secondary px-3 py-2 text-sm bg-white">
             <Filter size={14} /> Filter Hostels
          </button>
        </div>

        {/* Violations List */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-bg-base/50">
          <div className="space-y-4">
            {filteredViolators.map(student => {
              const isSevere = student.violations >= 3;
              return (
                <div key={student.id} className={`bg-white rounded-xl p-5 sm:p-6 border shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between transition-colors ${isSevere ? 'border-red-200 shadow-red-500/5' : 'border-amber-200 shadow-amber-500/5'}`}>
                  
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${isSevere ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                      {isSevere ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary text-lg flex items-center gap-2">
                        {student.name}
                        {isSevere && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">High Risk</span>}
                      </h3>
                      <p className="text-sm text-text-muted mt-0.5 font-mono">{student.usn} • {student.room} ({student.block})</p>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
                        <div>
                          <span className="text-text-muted uppercase text-[10px] font-bold block mb-0.5">Recorded Violations</span>
                          <span className={`font-bold ${isSevere ? 'text-red-600' : 'text-amber-600'}`}>{student.violations}</span>
                        </div>
                        <div>
                          <span className="text-text-muted uppercase text-[10px] font-bold block mb-0.5">Total Passes</span>
                          <span className="font-bold text-text-primary">{student.totalPasses}</span>
                        </div>
                        <div>
                          <span className="text-text-muted uppercase text-[10px] font-bold block mb-0.5">Late Returns</span>
                          <span className="font-bold text-accent-danger">{student.totalPasses - student.onTimeReturns}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-col gap-2 border-t md:border-t-0 border-border pt-4 md:pt-0">
                     <button className="btn btn-secondary w-full md:w-auto text-sm justify-start md:justify-center">
                       <Mail size={16} /> Notify Parent ({student.parentMobile})
                     </button>
                     <button className={`btn w-full md:w-auto text-sm justify-start md:justify-center ${isSevere ? 'bg-red-600 hover:bg-red-700 text-white border-transparent' : 'btn-danger-outline'}`}>
                       Suspend Pass Privilege
                     </button>
                  </div>

                </div>
              );
            })}
            
            {filteredViolators.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="font-bold text-text-primary text-lg">No violations found</h3>
                <p className="text-sm text-text-muted mt-1">There are no students matching your current filters.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminViolationsPage;
