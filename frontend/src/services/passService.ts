// passService.ts — Firestore pass CRUD + real-time listeners
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
  parentApproved: boolean | null;    // null = pending, true/false = decided
  parentApprovedAt?: Date;
  wardenApproved: boolean | null;
  wardenApprovedAt?: Date;
  wardenNote?: string;
  wardenId?: string;

  qrData?: string;
  exitTime?: Date;
  entryTime?: Date;
  isLate?: boolean;

  createdAt: Date;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function fromDoc(d: any): GatePass {
  const toDate = (v: any): Date | undefined =>
    v instanceof Timestamp ? v.toDate() : v ? new Date(v) : undefined;

  return {
    id: d.id,
    ...d.data(),
    outTime: toDate(d.data().outTime) ?? new Date(),
    expectedReturn: toDate(d.data().expectedReturn) ?? new Date(),
    actualReturn: toDate(d.data().actualReturn),
    parentApprovedAt: toDate(d.data().parentApprovedAt),
    wardenApprovedAt: toDate(d.data().wardenApprovedAt),
    exitTime: toDate(d.data().exitTime),
    entryTime: toDate(d.data().entryTime),
    createdAt: toDate(d.data().createdAt) ?? new Date(),
  } as GatePass;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

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
    outTime: Timestamp.fromDate(data.outTime),
    expectedReturn: Timestamp.fromDate(data.expectedReturn),
    status: 'pending' as PassStatus,
    parentApproved: null,
    wardenApproved: null,
    qrData: null,
    createdAt: serverTimestamp(),
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
  limit?: number;
}): Promise<GatePass[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (opts?.studentId) constraints.unshift(where('studentId', '==', opts.studentId));
  if (opts?.status)    constraints.unshift(where('status', '==', opts.status));

  const snap = await getDocs(query(collection(db, 'passes'), ...constraints));
  return snap.docs.map(fromDoc);
}

// ─── Real-time listeners ──────────────────────────────────────────────────────

/**
 * Subscribe to student's own passes in real-time.
 */
export function subscribeStudentPasses(
  studentId: string,
  onChange: (passes: GatePass[]) => void
): () => void {
  const q = query(
    collection(db, 'passes'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => onChange(snap.docs.map(fromDoc)));
}

/**
 * Subscribe to all pending passes for warden.
 */
export function subscribeAllPasses(
  onChange: (passes: GatePass[]) => void
): () => void {
  const q = query(collection(db, 'passes'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => onChange(snap.docs.map(fromDoc)));
}

// ─── Parent actions ──────────────────────────────────────────────────────────

export async function parentApprove(passId: string, approve: boolean): Promise<void> {
  const ref = doc(db, 'passes', passId);
  await updateDoc(ref, {
    parentApproved: approve,
    parentApprovedAt: serverTimestamp(),
    status: approve ? 'parent_approved' : 'parent_rejected',
  });
}

// ─── Warden actions ──────────────────────────────────────────────────────────

export async function wardenApprove(
  passId: string,
  wardenId: string,
  note?: string
): Promise<void> {
  const ref = doc(db, 'passes', passId);
  const qrData = `passmate:${passId}`;
  await updateDoc(ref, {
    wardenApproved: true,
    wardenApprovedAt: serverTimestamp(),
    wardenId,
    wardenNote: note || null,
    status: 'approved' as PassStatus,
    qrData,
  });
}

export async function wardenReject(
  passId: string,
  wardenId: string,
  note?: string
): Promise<void> {
  const ref = doc(db, 'passes', passId);
  await updateDoc(ref, {
    wardenApproved: false,
    wardenApprovedAt: serverTimestamp(),
    wardenId,
    wardenNote: note || null,
    status: 'rejected' as PassStatus,
  });
}

// ─── Guard actions ───────────────────────────────────────────────────────────

export async function markExit(passId: string): Promise<void> {
  await updateDoc(doc(db, 'passes', passId), {
    exitTime: serverTimestamp(),
    status: 'active' as PassStatus,
  });
}

export async function markEntry(passId: string): Promise<void> {
  const snap = await getDoc(doc(db, 'passes', passId));
  if (!snap.exists()) throw new Error('Pass not found');
  const data = snap.data();
  const now = new Date();
  const expectedReturn: Date =
    data.expectedReturn instanceof Timestamp
      ? data.expectedReturn.toDate()
      : new Date(data.expectedReturn);
  const isLate = now > expectedReturn;

  await updateDoc(doc(db, 'passes', passId), {
    entryTime: serverTimestamp(),
    actualReturn: serverTimestamp(),
    isLate,
    status: 'returned' as PassStatus,
  });
}

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
  const now = new Date();
  if (now > pass.expectedReturn) {
    return { valid: false, pass, reason: 'Pass has expired (past return time)' };
  }
  return { valid: true, pass };
}
