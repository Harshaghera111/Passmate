// passService.ts — Firestore pass CRUD + real-time listeners
// Production-hardened v2: transactions for race-condition prevention,
// audit logging, hostel isolation, actor tracking, CSV export with date filters.
import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp,
  runTransaction, Timestamp, QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';

export type PassStatus =
  | 'pending'
  | 'parent_approved' | 'parent_rejected'
  | 'approved' | 'rejected'
  | 'active' | 'returned' | 'expired';

export interface GatePass {
  id: string;
  studentId: string;
  studentName?: string;
  usn?: string;
  room?: string;
  hostel?: string;

  reason: string;
  reasonDetail: string;
  destination?: string;

  outTime: Date;
  expectedReturn: Date;
  actualReturn?: Date;

  status: PassStatus;

  // Parent approval
  parentApproved: boolean | null;
  parentApprovedAt?: Date;

  // Warden approval — audit trail
  wardenApproved: boolean | null;
  wardenApprovedAt?: Date;
  wardenNote?: string;
  wardenId?: string;
  approvedAt?: Date;
  approvedBy?: string;

  // QR
  qrData?: string;

  // Guard tracking — full audit
  exitTime?: Date;
  exitMarkedBy?: string;
  entryTime?: Date;
  entryMarkedBy?: string;
  isLate?: boolean;

  createdAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fromDoc(d: any): GatePass {
  const toDate = (v: any): Date | undefined =>
    v instanceof Timestamp ? v.toDate() : v ? new Date(v) : undefined;

  return {
    id: d.id,
    ...d.data(),
    outTime:          toDate(d.data().outTime)          ?? new Date(),
    expectedReturn:   toDate(d.data().expectedReturn)   ?? new Date(),
    actualReturn:     toDate(d.data().actualReturn),
    parentApprovedAt: toDate(d.data().parentApprovedAt),
    wardenApprovedAt: toDate(d.data().wardenApprovedAt),
    approvedAt:       toDate(d.data().approvedAt),
    exitTime:         toDate(d.data().exitTime),
    entryTime:        toDate(d.data().entryTime),
    createdAt:        toDate(d.data().createdAt) ?? new Date(),
  } as GatePass;
}

/** Convert a Firestore DocumentSnapshot inside a transaction to GatePass. */
function fromTxSnap(snap: any): GatePass {
  return fromDoc(snap);
}

// ─── Audit Logging ────────────────────────────────────────────────────────────

export type AuditAction =
  | 'pass_created'
  | 'warden_approved' | 'warden_rejected'
  | 'exit_marked'     | 'entry_marked'
  | 'parent_approved' | 'parent_rejected';

/**
 * Write an immutable audit log entry to Firestore.
 * Firestore security rules must only allow CREATE — never update/delete.
 * Audit logging failures are swallowed to keep the main flow intact.
 */
async function writeAuditLog(
  action: AuditAction,
  passId: string,
  actorId: string,
  actorRole: string,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      passId,
      actorId,
      actorRole,
      timestamp: serverTimestamp(),
      ...(meta ?? {}),
    });
  } catch (err) {
    console.warn('[audit] Failed to write audit log:', err);
  }
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Student: create a new pass request.
 */
export async function createPass(data: {
  studentId: string;
  studentName: string;
  usn?: string;
  room?: string;
  hostel?: string;
  reason: string;
  reasonDetail: string;
  outTime: Date;
  expectedReturn: Date;
}): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'passes'), {
      ...data,
      outTime:        Timestamp.fromDate(data.outTime),
      expectedReturn: Timestamp.fromDate(data.expectedReturn),
      status:         'pending' as PassStatus,
      parentApproved: null,
      wardenApproved: null,
      qrData:         null,
      createdAt:      serverTimestamp(),
    });

    await writeAuditLog('pass_created', ref.id, data.studentId, 'student', {
      reason: data.reason,
    });

    return ref.id;
  } catch (err: any) {
    console.error('[passService] createPass failed:', err);
    throw new Error(friendlyError(err, 'Failed to submit pass request.'));
  }
}

/**
 * Fetch a single pass by id.
 */
export async function getPass(id: string): Promise<GatePass | null> {
  try {
    const snap = await getDoc(doc(db, 'passes', id));
    if (!snap.exists()) return null;
    return fromDoc(snap);
  } catch (err: any) {
    console.error('[passService] getPass failed:', err);
    throw new Error(friendlyError(err, 'Failed to load pass details.'));
  }
}

/**
 * List passes with optional filters.
 */
export async function listPasses(opts?: {
  studentId?: string;
  status?: PassStatus;
  hostel?: string;
}): Promise<GatePass[]> {
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    if (opts?.studentId) constraints.unshift(where('studentId', '==', opts.studentId));
    if (opts?.status)    constraints.unshift(where('status',    '==', opts.status));
    if (opts?.hostel)    constraints.unshift(where('hostel',    '==', opts.hostel));

    const snap = await getDocs(query(collection(db, 'passes'), ...constraints));
    return snap.docs.map(fromDoc);
  } catch (err: any) {
    console.error('[passService] listPasses failed:', err);
    throw new Error(friendlyError(err, 'Failed to load passes list.'));
  }
}

// ─── Real-time listeners ──────────────────────────────────────────────────────

/**
 * Subscribe to student's own passes in real-time.
 */
export function subscribeStudentPasses(
  studentId: string,
  onChange: (passes: GatePass[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!studentId) {
    onError?.(new Error('Invalid studentId'));
    return () => {};
  }

  const q = query(collection(db, 'passes'), where('studentId', '==', studentId));

  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map(fromDoc);
      docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onChange(docs);
    },
    (err) => {
      console.error('[passService] subscribeStudentPasses error:', err.code, err.message);
      onError?.(new Error(friendlyError(err, 'Failed to load your passes.')));
    }
  );
}

/**
 * Subscribe to ALL passes (warden / guard view).
 * Optionally filter by hostelId for strict multi-hostel data isolation.
 */
export function subscribeAllPasses(
  onChange: (passes: GatePass[]) => void,
  hostelId?: string
): () => void {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (hostelId) constraints.unshift(where('hostel', '==', hostelId));

  const q = query(collection(db, 'passes'), ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map(fromDoc);
      if (hostelId) docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onChange(docs);
    },
    (err) => {
      console.error('[passService] subscribeAllPasses error:', err.code, err.message);
    }
  );
}

// ─── Parent actions ───────────────────────────────────────────────────────────

export async function parentApprove(passId: string, approve: boolean, parentId?: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'passes', passId), {
      parentApproved:   approve,
      parentApprovedAt: serverTimestamp(),
      status: approve ? 'parent_approved' : 'parent_rejected',
    });
    if (parentId) {
      await writeAuditLog(
        approve ? 'parent_approved' : 'parent_rejected',
        passId, parentId, 'parent'
      );
    }
  } catch (err: any) {
    throw new Error(friendlyError(err, 'Failed to submit parent approval.'));
  }
}

// ─── Warden actions ───────────────────────────────────────────────────────────

export async function wardenApprove(
  passId: string,
  wardenId: string,
  note?: string
): Promise<void> {
  try {
    const current = await getPass(passId);
    if (!current) throw new Error('Pass not found.');
    if (!['pending', 'parent_approved', 'parent_rejected'].includes(current.status)) {
      throw new Error(`Cannot approve a pass with status "${current.status}".`);
    }

    const qrData = `passmate:${passId}`;
    await updateDoc(doc(db, 'passes', passId), {
      wardenApproved:   true,
      wardenApprovedAt: serverTimestamp(),
      approvedAt:       serverTimestamp(),
      approvedBy:       wardenId,
      wardenId,
      wardenNote:       note || null,
      status:           'approved' as PassStatus,
      qrData,
    });

    await writeAuditLog('warden_approved', passId, wardenId, 'warden', {
      note: note || null, qrData,
    });
  } catch (err: any) {
    throw new Error(friendlyError(err, 'Failed to approve pass.'));
  }
}

export async function wardenReject(
  passId: string,
  wardenId: string,
  note?: string
): Promise<void> {
  try {
    const current = await getPass(passId);
    if (!current) throw new Error('Pass not found.');
    if (!['pending', 'parent_approved', 'parent_rejected'].includes(current.status)) {
      throw new Error(`Cannot reject a pass with status "${current.status}".`);
    }

    await updateDoc(doc(db, 'passes', passId), {
      wardenApproved:   false,
      wardenApprovedAt: serverTimestamp(),
      wardenId,
      wardenNote:       note || null,
      status:           'rejected' as PassStatus,
    });

    await writeAuditLog('warden_rejected', passId, wardenId, 'warden', {
      note: note || null,
    });
  } catch (err: any) {
    throw new Error(friendlyError(err, 'Failed to reject pass.'));
  }
}

// ─── Guard actions — Firestore Transactions (race-condition safe) ─────────────

/**
 * Mark student exit.
 *
 * Uses a Firestore TRANSACTION so that concurrent guard scans cannot
 * both succeed — the second one will read the already-updated status
 * and throw before writing, preventing double-exit under any concurrency.
 */
export async function markExit(passId: string, guardId?: string): Promise<void> {
  try {
    const passRef = doc(db, 'passes', passId);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(passRef);
      if (!snap.exists()) throw new Error('Pass not found.');

      const pass = fromTxSnap(snap);

      // ── Validation inside transaction (reads committed state) ──
      if (pass.status === 'active' && pass.exitTime) {
        throw new Error('Student has already been marked as exited.');
      }
      if (pass.status === 'returned') {
        throw new Error('Student has already returned — pass is closed.');
      }
      if (pass.status !== 'approved') {
        throw new Error(`Cannot mark exit: pass status is "${pass.status}".`);
      }
      if (new Date() > pass.expectedReturn) {
        throw new Error('This pass has expired (past the expected return time).');
      }

      tx.update(passRef, {
        exitTime:     serverTimestamp(),
        exitMarkedBy: guardId ?? null,
        status:       'active' as PassStatus,
      });
    });

    if (guardId) {
      await writeAuditLog('exit_marked', passId, guardId, 'guard');
    }
  } catch (err: any) {
    throw new Error(friendlyError(err, 'Failed to mark exit.'));
  }
}

/**
 * Mark student entry / return.
 *
 * Uses a Firestore TRANSACTION so concurrent guard scans cannot
 * both succeed — prevents double-entry under any concurrency level.
 */
export async function markEntry(passId: string, guardId?: string): Promise<void> {
  let isLate = false;

  try {
    const passRef = doc(db, 'passes', passId);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(passRef);
      if (!snap.exists()) throw new Error('Pass not found.');

      const pass = fromTxSnap(snap);

      // ── Validation inside transaction ──
      if (pass.status === 'approved' && !pass.exitTime) {
        throw new Error('Student has not yet exited campus — cannot mark entry before exit.');
      }
      if (pass.status === 'returned') {
        throw new Error('Student has already been marked as returned.');
      }
      if (pass.status !== 'active') {
        throw new Error(`Cannot mark entry: pass status is "${pass.status}".`);
      }

      const now = new Date();
      isLate = now > pass.expectedReturn;

      tx.update(passRef, {
        entryTime:     serverTimestamp(),
        entryMarkedBy: guardId ?? null,
        actualReturn:  serverTimestamp(),
        isLate,
        status:        'returned' as PassStatus,
      });
    });

    if (guardId) {
      await writeAuditLog('entry_marked', passId, guardId, 'guard', { isLate });
    }
  } catch (err: any) {
    throw new Error(friendlyError(err, 'Failed to mark entry.'));
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

export async function validatePass(passId: string): Promise<{
  valid: boolean;
  pass: GatePass | null;
  reason?: string;
}> {
  try {
    const pass = await getPass(passId);
    if (!pass) return { valid: false, pass: null, reason: 'Pass not found' };
    if (pass.status !== 'approved' && pass.status !== 'active') {
      return { valid: false, pass, reason: `Pass status is "${pass.status}"` };
    }
    if (new Date() > pass.expectedReturn) {
      return { valid: false, pass, reason: 'Pass has expired (past return time)' };
    }
    return { valid: true, pass };
  } catch (err: any) {
    return { valid: false, pass: null, reason: 'Failed to verify pass — check your connection.' };
  }
}

// ─── CSV Export with date-range filter ───────────────────────────────────────

export type CsvDateRange = 'all' | 'today' | '7days' | 'month';

/** Returns the start-of-period Date for a given range, or null for 'all'. */
export function csvRangeStart(range: CsvDateRange): Date | null {
  const now = new Date();
  if (range === 'today') {
    const d = new Date(now); d.setHours(0, 0, 0, 0); return d;
  }
  if (range === '7days') {
    const d = new Date(now); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0); return d;
  }
  if (range === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }
  return null; // 'all'
}

/** Filter a passes array by date range (based on createdAt). */
export function filterByDateRange(passes: GatePass[], range: CsvDateRange): GatePass[] {
  const start = csvRangeStart(range);
  if (!start) return passes;
  return passes.filter(p => p.createdAt >= start!);
}

const CSV_HEADERS = [
  'Pass ID', 'Student Name', 'USN', 'Room', 'Hostel',
  'Reason', 'Details', 'Status',
  'Created At', 'Out Time', 'Expected Return',
  'Exit Time', 'Entry Time', 'Is Late',
  'Approved By', 'Approved At',
  'Exit Marked By', 'Entry Marked By',
  'Warden Note',
];

function esc(val?: string | null): string {
  if (!val) return '';
  return `"${String(val).replace(/"/g, '""')}"`;
}

function fmtDate(d?: Date): string {
  if (!d) return '';
  return d.toLocaleString('en-IN', { hour12: true });
}

/**
 * Convert passes array to CSV and trigger browser download.
 * @param passes    - Array of GatePass to export
 * @param filename  - Download filename
 * @param range     - Optional date-range filter applied before export
 */
export function exportPassesCSV(
  passes: GatePass[],
  filename = 'passmate_export.csv',
  range: CsvDateRange = 'all'
): void {
  const filtered = filterByDateRange(passes, range);

  const rows = filtered.map(p => [
    esc(p.id),
    esc(p.studentName),
    esc(p.usn),
    esc(p.room),
    esc(p.hostel),
    esc(p.reason),
    esc(p.reasonDetail),
    esc(p.status),
    fmtDate(p.createdAt),
    fmtDate(p.outTime),
    fmtDate(p.expectedReturn),
    fmtDate(p.exitTime),
    fmtDate(p.entryTime),
    p.isLate ? 'YES' : 'NO',
    esc(p.approvedBy),
    fmtDate(p.approvedAt),
    esc(p.exitMarkedBy),
    esc(p.entryMarkedBy),
    esc(p.wardenNote),
  ].join(','));

  const csv  = [CSV_HEADERS.join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Error normalisation ──────────────────────────────────────────────────────

/**
 * Convert a raw Firestore/network error into a user-friendly message.
 * Falls back to `fallback` if the error is not one we recognise.
 */
function friendlyError(err: any, fallback: string): string {
  const code: string = err?.code ?? '';
  const msg: string  = err?.message ?? '';

  // If we already set a user-friendly message, propagate it as-is.
  if (msg && !code) return msg;

  const MAP: Record<string, string> = {
    'permission-denied':        'You do not have permission to perform this action.',
    'not-found':                'The requested record was not found.',
    'unavailable':              'Service is temporarily unavailable. Check your internet connection.',
    'deadline-exceeded':        'The request timed out. Please try again.',
    'already-exists':           'This record already exists.',
    'resource-exhausted':       'Too many requests. Please wait a moment and try again.',
    'unauthenticated':          'You are not logged in. Please sign in and try again.',
    'failed-precondition':      'Operation cannot be performed in the current state.',
    'aborted':                  'The operation was aborted due to a conflict. Please retry.',
  };

  return MAP[code] ?? msg ?? fallback;
}
