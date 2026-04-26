// passService.ts — Firestore pass CRUD + real-time listeners
// Production-hardened: audit logging, guard actor tracking, double-action prevention,
// hostel filtering, and CSV export.
import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp,
  Timestamp, QueryConstraint,
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
  approvedAt?: Date;     // alias for wardenApprovedAt (explicit for clarity)
  approvedBy?: string;   // warden UID

  // QR
  qrData?: string;

  // Guard tracking — full audit
  exitTime?: Date;
  exitMarkedBy?: string;   // guard UID who marked exit
  entryTime?: Date;
  entryMarkedBy?: string;  // guard UID who marked entry
  isLate?: boolean;

  createdAt: Date;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

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

// ─── Audit Logging ────────────────────────────────────────────────────────────

export type AuditAction =
  | 'pass_created'
  | 'warden_approved' | 'warden_rejected'
  | 'exit_marked' | 'entry_marked'
  | 'parent_approved' | 'parent_rejected';

export interface AuditLog {
  action: AuditAction;
  passId: string;
  actorId: string;
  actorRole: string;
  timestamp: any;  // serverTimestamp
  meta?: Record<string, any>;
}

/**
 * Write an immutable audit log entry.
 * Firestore rules must only allow create, never update/delete.
 */
async function writeAuditLog(
  action: AuditAction,
  passId: string,
  actorId: string,
  actorRole: string,
  meta?: Record<string, any>
): Promise<void> {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      passId,
      actorId,
      actorRole,
      timestamp: serverTimestamp(),
      ...(meta ?? {}),
    } satisfies Omit<AuditLog, 'timestamp'> & { timestamp: any });
  } catch (err) {
    // Audit logging failures must not break the main flow
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
}

/**
 * Fetch a single pass by id.
 */
export async function getPass(id: string): Promise<GatePass | null> {
  const snap = await getDoc(doc(db, 'passes', id));
  if (!snap.exists()) return null;
  return fromDoc(snap);
}

/**
 * List passes with optional filters.
 */
export async function listPasses(opts?: {
  studentId?: string;
  status?: PassStatus;
  hostel?: string;
}): Promise<GatePass[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (opts?.studentId) constraints.unshift(where('studentId', '==', opts.studentId));
  if (opts?.status)    constraints.unshift(where('status',    '==', opts.status));
  if (opts?.hostel)    constraints.unshift(where('hostel',    '==', opts.hostel));

  const snap = await getDocs(query(collection(db, 'passes'), ...constraints));
  return snap.docs.map(fromDoc);
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
    console.error('[passService] subscribeStudentPasses called with empty studentId');
    onError?.(new Error('Invalid studentId'));
    return () => {};
  }

  const q = query(
    collection(db, 'passes'),
    where('studentId', '==', studentId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map(fromDoc);
      docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onChange(docs);
    },
    (err) => {
      console.error('[passService] onSnapshot error:', err.code, err.message);
      onError?.(err);
    }
  );
}

/**
 * Subscribe to ALL passes (warden/guard view).
 * Optionally filter by hostelId for multi-hostel isolation.
 */
export function subscribeAllPasses(
  onChange: (passes: GatePass[]) => void,
  hostelId?: string
): () => void {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (hostelId) constraints.unshift(where('hostel', '==', hostelId));

  const q = query(collection(db, 'passes'), ...constraints);
  return onSnapshot(q, snap => {
    const docs = snap.docs.map(fromDoc);
    // Secondary sort locally when multiple constraints are used
    if (hostelId) docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    onChange(docs);
  });
}

// ─── Parent actions ───────────────────────────────────────────────────────────

export async function parentApprove(passId: string, approve: boolean, parentId?: string): Promise<void> {
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
}

// ─── Warden actions ───────────────────────────────────────────────────────────

export async function wardenApprove(
  passId: string,
  wardenId: string,
  note?: string
): Promise<void> {
  // Guard: verify current status allows approval
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
    note: note || null,
    qrData,
  });
}

export async function wardenReject(
  passId: string,
  wardenId: string,
  note?: string
): Promise<void> {
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
}

// ─── Guard actions — hardened with double-action prevention ──────────────────

/**
 * Mark student exit.
 * Validates: pass must be 'approved' (not already 'active'/'returned').
 * Stores exitMarkedBy for full audit trail.
 */
export async function markExit(passId: string, guardId?: string): Promise<void> {
  const pass = await getPass(passId);
  if (!pass) throw new Error('Pass not found.');

  // Prevent double-exit
  if (pass.status === 'active' && pass.exitTime) {
    throw new Error('Student has already been marked as exited.');
  }
  if (pass.status === 'returned') {
    throw new Error('Student has already returned — pass is closed.');
  }
  if (pass.status !== 'approved') {
    throw new Error(`Cannot mark exit for a pass with status "${pass.status}".`);
  }

  // Check pass has not expired
  const now = new Date();
  if (now > pass.expectedReturn) {
    throw new Error('This pass has expired (current time is past the expected return time).');
  }

  await updateDoc(doc(db, 'passes', passId), {
    exitTime:     serverTimestamp(),
    exitMarkedBy: guardId ?? null,
    status:       'active' as PassStatus,
  });

  if (guardId) {
    await writeAuditLog('exit_marked', passId, guardId, 'guard');
  }
}

/**
 * Mark student entry / return.
 * Validates: pass must be 'active' (student must have exited first).
 * Stores entryMarkedBy and isLate flag.
 */
export async function markEntry(passId: string, guardId?: string): Promise<void> {
  const pass = await getPass(passId);
  if (!pass) throw new Error('Pass not found.');

  // Prevent entry without prior exit
  if (pass.status === 'approved' && !pass.exitTime) {
    throw new Error('Student has not yet exited campus — cannot mark entry before exit.');
  }
  // Prevent double-entry
  if (pass.status === 'returned') {
    throw new Error('Student has already been marked as returned.');
  }
  if (pass.status !== 'active') {
    throw new Error(`Cannot mark entry for a pass with status "${pass.status}".`);
  }

  const now  = new Date();
  const expectedReturn: Date =
    pass.expectedReturn instanceof Date
      ? pass.expectedReturn
      : new Date(pass.expectedReturn as any);
  const isLate = now > expectedReturn;

  await updateDoc(doc(db, 'passes', passId), {
    entryTime:     serverTimestamp(),
    entryMarkedBy: guardId ?? null,
    actualReturn:  serverTimestamp(),
    isLate,
    status:        'returned' as PassStatus,
  });

  if (guardId) {
    await writeAuditLog('entry_marked', passId, guardId, 'guard', { isLate });
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate a pass for the guard: exists + approved + within time window.
 */
export async function validatePass(passId: string): Promise<{
  valid: boolean;
  pass: GatePass | null;
  reason?: string;
}> {
  const pass = await getPass(passId);
  if (!pass) return { valid: false, pass: null, reason: 'Pass not found' };
  if (pass.status !== 'approved' && pass.status !== 'active') {
    return { valid: false, pass, reason: `Pass status is "${pass.status}"` };
  }
  if (new Date() > pass.expectedReturn) {
    return { valid: false, pass, reason: 'Pass has expired (past return time)' };
  }
  return { valid: true, pass };
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

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
 */
export function exportPassesCSV(passes: GatePass[], filename = 'passmate_export.csv'): void {
  const rows = passes.map(p => [
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
