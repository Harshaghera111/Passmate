import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Search, Filter, Loader } from 'lucide-react';

import { passApi, type GatePass } from '../../lib/api';
import StatusPill from '../../components/ui/StatusPill';

type FilterType = 'all' | 'approved' | 'rejected' | 'late';

const HistoryPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    fetchPasses();
  }, []);

  const filteredPasses = passes.filter(p => {
    if (filter === 'approved' && p.status !== 'approved' && p.status !== 'returned' && p.status !== 'active') return false;
    if (filter === 'rejected' && p.status !== 'rejected') return false;
    if (filter === 'late' && !(p.isLate || p.is_late)) return false;
    if (search && !(p.reasonDetail || p.reason_detail || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sora text-text-primary">My Passes</h1>
          <p className="text-text-muted mt-1 text-sm">View and track all your previous pass requests.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search by destination or reason..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-input bg-white focus:border-accent-primary focus:outline-none"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {(['all', 'approved', 'rejected', 'late'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                'px-4 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors',
                filter === f 
                  ? 'bg-text-primary text-white' 
                  : 'bg-white text-text-secondary border border-border hover:bg-bg-muted'
              ].join(' ')}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-accent-primary" size={32} />
          </div>
        ) : filteredPasses.length > 0 ? filteredPasses.map(pass => (
          <div key={pass.id} className="bg-white rounded-xl p-5 sm:p-6 border border-border shadow-sm card-hover flex flex-col sm:flex-row gap-4 justify-between items-start">
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <StatusPill status={pass.status} />
                {(pass.isLate || pass.is_late) && <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-badge text-[10px] font-bold uppercase tracking-wider">Late Return</span>}
              </div>
              
              <div>
                <h3 className="font-semibold text-text-primary truncate">{pass.reasonDetail || pass.reason_detail}</h3>
                <p className="text-xs text-text-muted mt-1">
                  Out: {format(new Date(pass.outTime || pass.out_time || new Date()), 'MMM d, h:mm a')}
                  {(pass.actualReturn || pass.actual_return) ? ` • Return: ${format(new Date(pass.actualReturn || pass.actual_return || new Date()), 'MMM d, h:mm a')}` : ''}
                </p>
              </div>
            </div>
            
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
              <span className="text-[11px] font-mono bg-bg-muted px-2 py-1 rounded-badge text-text-muted">{pass.id}</span>
              {(pass.status === 'approved' || pass.status === 'active') && (
                <button className="text-xs font-semibold text-accent-primary hover:underline mt-2 hidden sm:block">View QR Code</button>
              )}
            </div>
          </div>
        )) : (
          <div className="text-center py-12 bg-white rounded-xl border border-border border-dashed">
            <Filter size={32} className="mx-auto text-border mb-3" />
            <h3 className="font-semibold text-text-primary">No passes found</h3>
            <p className="text-sm text-text-muted mt-1">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
