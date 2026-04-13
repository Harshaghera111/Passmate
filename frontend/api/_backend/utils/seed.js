// seed.js — Async seed with knex
import { db, setupSchema, uuidv4 } from '../db.js';
import bcrypt from 'bcryptjs';

const HASH = bcrypt.hashSync('passmate123', 10);

const hostels = [
  { id: 'h1', name: 'Cauvery Boys Hostel', type: 'boys', block: 'Block A' },
  { id: 'h2', name: 'Tungabhadra Girls Hostel', type: 'girls', block: 'Block B' },
  { id: 'h3', name: 'Krishna Boys Hostel', type: 'boys', block: 'Block C' },
];

const users = [
  // Wardens
  { id: 'w1', usn: null, name: 'Dr. Ramesh Kumar', role: 'warden', mobile: '9845001234', email: 'ramesh@college.edu', hostel_id: 'h1', violations: 0, total_passes: 0, on_time_returns: 0 },
  { id: 'w2', usn: null, name: 'Mrs. Anitha Rao', role: 'warden', mobile: '9845002345', email: 'anitha@college.edu', hostel_id: 'h2', violations: 0, total_passes: 0, on_time_returns: 0 },
  // Guards
  { id: 'g1', usn: null, name: 'Suresh Babu', role: 'guard', mobile: '9900012345', hostel_id: 'h1', violations: 0, total_passes: 0, on_time_returns: 0 },
  { id: 'g2', usn: null, name: 'Mohan Das', role: 'guard', mobile: '9900023456', hostel_id: 'h2', violations: 0, total_passes: 0, on_time_returns: 0 },
  // Admin
  { id: 'a1', usn: null, name: 'System Admin', role: 'admin', mobile: '9000000001', email: 'admin@college.edu', hostel_id: null, violations: 0, total_passes: 0, on_time_returns: 0 },
  // Students
  { id: 's1', usn: '1DS22CS042', name: 'Harsh Verma', role: 'student', mobile: '9845012345', parent_mobile: '9845098765', hostel_id: 'h1', room: 'A-204', branch: 'CSE', year: 3, violations: 0, total_passes: 5, on_time_returns: 5 },
  { id: 's2', usn: '1DS22CS078', name: 'Riya Sharma', role: 'student', mobile: '9845023456', parent_mobile: '9845087654', hostel_id: 'h2', room: 'B-108', branch: 'CSE', year: 3, violations: 1, total_passes: 7, on_time_returns: 6 },
  { id: 's3', usn: '1DS22EC014', name: 'Kiran Raj', role: 'student', mobile: '9845034567', parent_mobile: '9845076543', hostel_id: 'h1', room: 'A-302', branch: 'ECE', year: 3, violations: 0, total_passes: 3, on_time_returns: 3 },
  { id: 's4', usn: '1DS22ME031', name: 'Priya Menon', role: 'student', mobile: '9845045678', parent_mobile: '9845065432', hostel_id: 'h2', room: 'B-215', branch: 'ME', year: 3, violations: 3, total_passes: 10, on_time_returns: 7 },
  { id: 's5', usn: '1DS22CS101', name: 'Arjun Nair', role: 'student', mobile: '9845056789', parent_mobile: '9845054321', hostel_id: 'h1', room: 'A-119', branch: 'CSE', year: 3, violations: 2, total_passes: 8, on_time_returns: 6 },
  { id: 's6', usn: '1DS22IS007', name: 'Sneha Kulkarni', role: 'student', mobile: '9845067890', parent_mobile: '9845043210', hostel_id: 'h2', room: 'B-301', branch: 'ISE', year: 3, violations: 0, total_passes: 4, on_time_returns: 4 },
];

const now = new Date();
const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString().replace('T', ' ').slice(0, 19);
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString().replace('T', ' ').slice(0, 19);
const hoursFromNow = (h) => new Date(now.getTime() + h * 3600000).toISOString().replace('T', ' ').slice(0, 19);

const passes = [
  {
    id: 'GP-2024-0415', student_id: 's1',
    reason: 'Medical', reason_detail: 'Doctor appointment at Apollo Hospital, Koramangala',
    out_time: hoursAgo(2), expected_return: hoursFromNow(6),
    status: 'approved', parent_status: 'approved',
    parent_approved_at: hoursAgo(1), parent_token: 'tok-s1-001',
    warden_id: 'w1', warden_approved_at: hoursAgo(0.5),
    qr_code: 'GP-2024-0415::s1::1DS22CS042::approved', is_late: false,
  },
  {
    id: 'GP-2024-0416', student_id: 's2',
    reason: 'Home Visit', reason_detail: 'Going home for Ugadi festival celebrations with family',
    out_time: daysAgo(1), expected_return: hoursFromNow(24),
    status: 'pending', parent_status: 'approved',
    parent_approved_at: hoursAgo(23), parent_token: 'tok-s2-001',
    warden_id: null, is_late: false,
  },
  {
    id: 'GP-2024-0417', student_id: 's3',
    reason: 'Personal Work', reason_detail: 'Bank account KYC update at SBI Marathahalli',
    out_time: daysAgo(2), expected_return: hoursAgo(38),
    actual_return: hoursAgo(38), status: 'returned', parent_status: 'approved',
    parent_approved_at: daysAgo(2.1), parent_token: 'tok-s3-001',
    warden_id: 'w1', warden_approved_at: daysAgo(2),
    exit_scanned_at: daysAgo(2), is_late: false,
    qr_code: 'GP-2024-0417::s3::1DS22EC014::returned',
  },
  {
    id: 'GP-2024-0418', student_id: 's4',
    reason: 'Shopping', reason_detail: 'Buying textbooks from Premier Book Store, Jayanagar',
    out_time: daysAgo(3), expected_return: hoursAgo(66),
    actual_return: hoursAgo(62), status: 'returned', parent_status: 'approved',
    parent_approved_at: daysAgo(3.1), parent_token: 'tok-s4-001',
    warden_id: 'w2', warden_approved_at: daysAgo(3),
    exit_scanned_at: daysAgo(3), is_late: true,
    qr_code: 'GP-2024-0418::s4::1DS22ME031::returned',
  },
  {
    id: 'GP-2024-0419', student_id: 's5',
    reason: 'Personal Work', reason_detail: 'ATM visit near campus',
    out_time: daysAgo(4), expected_return: hoursAgo(95),
    status: 'rejected', parent_status: 'approved',
    parent_approved_at: daysAgo(4.1), parent_token: 'tok-s5-001',
    warden_id: 'w1', warden_note: 'ATM is within campus premises. No pass needed.',
    is_late: false,
  },
  {
    id: 'GP-2024-0420', student_id: 's1',
    reason: 'Entertainment', reason_detail: 'Movie with friends at PVR Orion Mall',
    out_time: daysAgo(5), expected_return: hoursAgo(114),
    actual_return: hoursAgo(114), status: 'returned', parent_status: 'approved',
    parent_approved_at: daysAgo(5.1), parent_token: 'tok-s1-002',
    warden_id: 'w1', warden_approved_at: daysAgo(5),
    exit_scanned_at: daysAgo(5), is_late: false,
    qr_code: 'GP-2024-0420::s1::1DS22CS042::returned',
  },
];

const logsData = [
  { actor_id: 's1', actor_name: 'Harsh Verma', role: 'student', action: 'PASS_CREATED', entity_id: 'GP-2024-0415', entity_type: 'gate_pass' },
  { actor_id: 'w1', actor_name: 'Dr. Ramesh Kumar', role: 'warden', action: 'PASS_APPROVED', entity_id: 'GP-2024-0415', entity_type: 'gate_pass' },
  { actor_id: 'g1', actor_name: 'Suresh Babu', role: 'guard', action: 'PASS_EXIT_SCANNED', entity_id: 'GP-2024-0417', entity_type: 'gate_pass' },
  { actor_id: 'g1', actor_name: 'Suresh Babu', role: 'guard', action: 'PASS_ENTRY_SCANNED', entity_id: 'GP-2024-0417', entity_type: 'gate_pass' },
  { actor_id: 'w1', actor_name: 'Dr. Ramesh Kumar', role: 'warden', action: 'PASS_REJECTED', entity_id: 'GP-2024-0419', entity_type: 'gate_pass' },
  { actor_id: 'a1', actor_name: 'System Admin', role: 'admin', action: 'USER_CREATED', entity_id: 's6', entity_type: 'user' },
];

const violationsData = [
  { student_id: 's2', pass_id: 'GP-2024-0418', type: 'LATE_RETURN', note: 'Returned 4 hours late' },
  { student_id: 's4', pass_id: 'GP-2024-0418', type: 'LATE_RETURN', note: 'Returned 1.5 hours late' },
  { student_id: 's4', pass_id: null, type: 'LATE_RETURN', note: 'Previous incident, Dec 2023' },
  { student_id: 's4', pass_id: null, type: 'UNAUTHORIZED_EXIT', note: 'Left campus without pass' },
  { student_id: 's5', pass_id: null, type: 'LATE_RETURN', note: 'Returned 2 hours late, Nov 2023' },
  { student_id: 's5', pass_id: null, type: 'LATE_RETURN', note: 'Second late return, Jan 2024' },
];

export default async function seed() {
  // Check if already seeded
  const count = await db('users').count('id as c').first();
  if (count.c > 0) {
    console.log('✅ Database already seeded — skipping.');
    return;
  }

  console.log('🌱 Seeding database with Indian college data...');

  // Insert hostels
  await db('hostels').insert(hostels);

  // Insert users
  await db('users').insert(users.map(u => ({ ...u, password_hash: HASH })));

  // Insert passes
  await db('gate_passes').insert(passes);

  // Insert audit logs
  await db('audit_logs').insert(logsData.map(l => ({ ...l, id: uuidv4(), ip: '127.0.0.1' })));

  // Insert violations
  await db('violations').insert(violationsData.map(v => ({ ...v, id: uuidv4() })));

  console.log('✅ Database seeded!');
  console.log(`   ${users.length} users | ${passes.length} passes | ${logsData.length} logs`);
}
