import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Search, Filter, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { subscribeStudentPasses, type GatePass } from '../../services/passService';
import StatusPill from '../../components/ui/StatusPill';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

// Map Firestore statuses → display filter buckets
const matchesFilter = (pass: GatePass, filter: FilterType): boolean => {
  if (filter === 'all') return true;
  if (filter === 'pending')  return ['pending', 'parent_approved', 'parent_rejected'].includes(pass.status);
  if (filter === 'approved') return ['approved', 'active', 'returned'].includes(pass.status);
  if (filter === 'rejected') return pass.status === 'rejected';
  return true;
};

// Status label for display
const STATUS_LABEL: Record<string, string> = {
  pending:          'Pending',
  parent_approved:  'Parent Approved',
  parent_rejected:  'Parent Rejected',
  approved:         'Approved',
  rejected:         'Rejected',
  active:           'Out of Campus',
  returned:         'Returned',
  expired:          'Expired',
};

// Status dot color
const STATUS_DOT: Record<string, string> = {
  pending:          'bg-amber-400',
  parent_approved:  'bg-amber-400',
  parent_rejected:  'bg-red-400',
  approved:         'bg-emerald-500',
  rejected:         'bg-red-500',
  active:           'bg-blue-500',
  returned:         'bg-emerald-600',
  expired:          'bg-gray-400',
};

const HistoryPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate  = useNavigate();

  const [filter,    setFilter]    = useState<FilterType>('all');
  const [search,    setSearch]    = useState('');
  const [passes,    setPasses]    = useState<GatePass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Real-time Firestore subscription ─────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const unsub = subscribeStudentPasses(
      user.uid,
      (data) => {
        setPasses(data);
        setIsLoading(false);
      },
      (err) => {
        console.error('[HistoryPage] Firestore error:', err);
        setIsLoading(false);
      }
    );

    return unsub;
  }, [user?.uid]);

  const filteredPasses = passes.filter(p => {
    if (!matchesFilter(p, filter)) return false;
    const q = search.toLowerCase();
    if (q && !(p.reasonDetail || '').toLowerCase().includes(q) && !(p.reason || '').toLowerCase().includes(q)) return false;
    return true;
  });

  const pendingCount  = passes.filter(p => ['pending', 'parent_approved'].includes(p.status)).length;
  const approvedCount = passes.filter(p => ['approved', 'active', 'returned'].includes(p.status)).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 page-enter">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sora text-text-primary">My Passes</h1>
          <p className="text-text-muted mt-1 text-sm">
            {passes.length} total · {pendingCount} pending · {approvedCount} approved
          </p>
        </div>
        <button
          onClick={() => navigate('/student/request/new')}
          className="btn btn-primary gap-2 h-10 px-5 shadow-sm"
        >
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* ── Filters + Search ── */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by reason or destination..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-input bg-white focus:border-accent-primary focus:outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'pending', 'approved', 'rejected'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                'px-4 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all',
                filter === f
                  ? 'bg-text-primary text-white'
                  : 'bg-white text-text-secondary border border-border hover:bg-bg-muted',
              ].join(' ')}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pass List ── */}
      <div className="space-y-3">
        {isLoading ? (
          // Skeleton loaders
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 border border-border shadow-sm animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))
        ) : filteredPasses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-border">
            <div className="w-14 h-14 bg-bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <Filter size={24} className="text-text-muted" />
            </div>
            <h3 className="font-semibold text-text-primary">
              {passes.length === 0 ? 'No passes yet' : 'No passes match your filter'}
            </h3>
            <p className="text-sm text-text-muted mt-1">
              {passes.length === 0
                ? 'Submit your first gate pass request to get started.'
                : 'Try clearing your search or changing the filter.'}
            </p>
            {passes.length === 0 && (
              <button
                onClick={() => navigate('/student/request/new')}
                className="btn btn-primary mt-5 h-10 px-6 text-sm"
              >
                <Plus size={15} /> Request a Pass
              </button>
            )}
          </div>
        ) : (
          filteredPasses.map(pass => (
            <div
              key={pass.id}
              className="bg-white rounded-xl p-5 border border-border shadow-sm card-hover"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">

                {/* Left: status dot + info */}
                <div className="flex gap-4 flex-1 min-w-0">
                  <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${STATUS_DOT[pass.status] ?? 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-text-primary truncate">
                        {pass.reasonDetail || pass.reason || 'Gate Pass'}
                      </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                      Requested · {format(pass.createdAt, 'MMM d, h:mm a')}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Out: {format(pass.outTime, 'MMM d, h:mm a')}
                      {' → '}
                      Return by: {format(pass.expectedReturn, 'MMM d, h:mm a')}
                    </p>

                    {/* Warden note */}
                    {pass.wardenNote && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 mt-2 italic">
                        Warden note: "{pass.wardenNote}"
                      </p>
                    )}

                    {/* Late badge */}
                    {pass.isLate && (
                      <span className="inline-block mt-2 bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-badge text-[10px] font-bold uppercase tracking-wider">
                        Late Return
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: status + pass ID */}
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border w-full sm:w-auto">
                  <StatusPill status={pass.status as any} size="sm" />

                  <span className="text-[10px] font-mono bg-bg-muted px-2 py-1 rounded-badge text-text-muted">
                    #{pass.id.slice(0, 8)}
                  </span>

                  {/* Status label for extra clarity */}
                  <span className="text-[11px] text-text-muted hidden sm:block">
                    {STATUS_LABEL[pass.status] ?? pass.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
