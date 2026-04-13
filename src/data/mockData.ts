// PassMate — Realistic Indian College Mock Data

export type Role = 'student' | 'warden' | 'guard' | 'admin';

export interface Student {
  id: string;
  name: string;
  usn: string;
  room: string;
  block: string;
  hostel: string;
  mobile: string;
  parentMobile: string;
  email: string;
  photo: string;
  year: number;
  branch: string;
  violations: number;
  totalPasses: number;
  onTimeReturns: number;
}

export interface GatePass {
  id: string;
  studentId: string;
  studentName: string;
  usn: string;
  room: string;
  block: string;
  reason: ReasonType;
  reasonDetail: string;
  outTime: string;
  expectedReturn: string;
  actualReturn?: string;
  status: PassStatus;
  parentStatus: 'pending' | 'approved' | 'rejected';
  parentApprovedAt?: string;
  wardenName?: string;
  wardenApprovedAt?: string;
  createdAt: string;
  exitScannedAt?: string;
  qrCode: string;
  isLate?: boolean;
  guardNote?: string;
}

export type PassStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'returned' | 'expired';
export type ReasonType = 'home_visit' | 'medical' | 'personal' | 'event' | 'other';

export const REASON_LABELS: Record<ReasonType, string> = {
  home_visit: 'Home Visit',
  medical: 'Medical',
  personal: 'Personal Work',
  event: 'College Event',
  other: 'Other',
};

export const REASONS: { value: ReasonType; label: string }[] = [
  { value: 'home_visit', label: 'Home Visit' },
  { value: 'medical', label: 'Medical' },
  { value: 'personal', label: 'Personal Work' },
  { value: 'event', label: 'College Event' },
  { value: 'other', label: 'Other' },
];

export const mockStudents: Student[] = [
  {
    id: 'STU001',
    name: 'Harsh Verma',
    usn: '1DS22CS042',
    room: 'A-204',
    block: 'A Block',
    hostel: 'Cauvery Boys Hostel',
    mobile: '9876543210',
    parentMobile: '9845012345',
    email: 'harsh.v@dsu.edu',
    photo: '',
    year: 3,
    branch: 'CSE',
    violations: 1,
    totalPasses: 12,
    onTimeReturns: 10,
  },
  {
    id: 'STU002',
    name: 'Riya Sharma',
    usn: '1DS22EC078',
    room: 'B-102',
    block: 'B Block',
    hostel: 'Tungabhadra Girls Hostel',
    mobile: '9988776655',
    parentMobile: '9911223344',
    email: 'riya.s@dsu.edu',
    photo: '',
    year: 2,
    branch: 'ECE',
    violations: 0,
    totalPasses: 8,
    onTimeReturns: 8,
  },
  {
    id: 'STU003',
    name: 'Arjun Nair',
    usn: '1DS23ME015',
    room: 'C-308',
    block: 'C Block',
    hostel: 'Cauvery Boys Hostel',
    mobile: '8765432109',
    parentMobile: '8754321098',
    email: 'arjun.n@dsu.edu',
    photo: '',
    year: 1,
    branch: 'ME',
    violations: 3,
    totalPasses: 15,
    onTimeReturns: 10,
  },
  {
    id: 'STU004',
    name: 'Priya Menon',
    usn: '1DS21CS156',
    room: 'A-410',
    block: 'A Block',
    hostel: 'Tungabhadra Girls Hostel',
    mobile: '7654321098',
    parentMobile: '7643210987',
    email: 'priya.m@dsu.edu',
    photo: '',
    year: 4,
    branch: 'CSE',
    violations: 0,
    totalPasses: 24,
    onTimeReturns: 24,
  },
  {
    id: 'STU005',
    name: 'Karthik Reddy',
    usn: '1DS23AI033',
    room: 'D-115',
    block: 'D Block',
    hostel: 'Cauvery Boys Hostel',
    mobile: '9123456789',
    parentMobile: '9112345678',
    email: 'karthik.r@dsu.edu',
    photo: '',
    year: 1,
    branch: 'AI&ML',
    violations: 2,
    totalPasses: 6,
    onTimeReturns: 4,
  },
  {
    id: 'STU006',
    name: 'Sneha Iyer',
    usn: '1DS22IS099',
    room: 'B-205',
    block: 'B Block',
    hostel: 'Tungabhadra Girls Hostel',
    mobile: '8877665544',
    parentMobile: '8866554433',
    email: 'sneha.i@dsu.edu',
    photo: '',
    year: 3,
    branch: 'ISE',
    violations: 1,
    totalPasses: 18,
    onTimeReturns: 16,
  },
  {
    id: 'STU007',
    name: 'Rahul Kumar',
    usn: '1DS21CS089',
    room: 'A-312',
    block: 'A Block',
    hostel: 'Cauvery Boys Hostel',
    mobile: '9001234567',
    parentMobile: '9009876543',
    email: 'rahul.k@dsu.edu',
    photo: '',
    year: 4,
    branch: 'CSE',
    violations: 4,
    totalPasses: 30,
    onTimeReturns: 22,
  },
  {
    id: 'STU008',
    name: 'Divya Krishnan',
    usn: '1DS23CS201',
    room: 'C-104',
    block: 'C Block',
    hostel: 'Tungabhadra Girls Hostel',
    mobile: '7712345678',
    parentMobile: '7701234567',
    email: 'divya.k@dsu.edu',
    photo: '',
    year: 1,
    branch: 'CSE',
    violations: 0,
    totalPasses: 3,
    onTimeReturns: 3,
  },
];

export const mockPasses: GatePass[] = [
  {
    id: 'GP-2024-0421',
    studentId: 'STU001',
    studentName: 'Harsh Verma',
    usn: '1DS22CS042',
    room: 'A-204',
    block: 'A Block',
    reason: 'home_visit',
    reasonDetail: 'Going home for Ugadi festival celebrations with family.',
    outTime: '2024-04-13T14:00:00',
    expectedReturn: '2024-04-15T20:00:00',
    status: 'approved',
    parentStatus: 'approved',
    parentApprovedAt: '2024-04-13T09:30:00',
    wardenName: 'Dr. Ramesh Kumar',
    wardenApprovedAt: '2024-04-13T10:15:00',
    createdAt: '2024-04-13T08:00:00',
    qrCode: 'GP-2024-0421-HASH-XK9M2P',
    isLate: false,
  },
  {
    id: 'GP-2024-0420',
    studentId: 'STU002',
    studentName: 'Riya Sharma',
    usn: '1DS22EC078',
    room: 'B-102',
    block: 'B Block',
    reason: 'medical',
    reasonDetail: 'Doctor appointment at Manipal Hospital for routine checkup.',
    outTime: '2024-04-12T10:00:00',
    expectedReturn: '2024-04-12T16:00:00',
    actualReturn: '2024-04-12T15:45:00',
    status: 'returned',
    parentStatus: 'approved',
    parentApprovedAt: '2024-04-12T08:20:00',
    wardenName: 'Mrs. Anitha Rao',
    wardenApprovedAt: '2024-04-12T09:00:00',
    createdAt: '2024-04-12T07:30:00',
    exitScannedAt: '2024-04-12T10:05:00',
    qrCode: 'GP-2024-0420-HASH-YL3N7Q',
    isLate: false,
  },
  {
    id: 'GP-2024-0419',
    studentId: 'STU003',
    studentName: 'Arjun Nair',
    usn: '1DS23ME015',
    room: 'C-308',
    block: 'C Block',
    reason: 'personal',
    reasonDetail: 'Bank account opening at SBI Marathahalli branch.',
    outTime: '2024-04-13T11:00:00',
    expectedReturn: '2024-04-13T17:00:00',
    status: 'pending',
    parentStatus: 'pending',
    createdAt: '2024-04-13T07:00:00',
    qrCode: 'GP-2024-0419-HASH-ZM4O1R',
    isLate: false,
  },
  {
    id: 'GP-2024-0418',
    studentId: 'STU005',
    studentName: 'Karthik Reddy',
    usn: '1DS23AI033',
    room: 'D-115',
    block: 'D Block',
    reason: 'event',
    reasonDetail: 'Attending TechFest at IISc Bangalore.',
    outTime: '2024-04-11T08:00:00',
    expectedReturn: '2024-04-11T21:00:00',
    actualReturn: '2024-04-11T23:30:00',
    status: 'returned',
    parentStatus: 'approved',
    parentApprovedAt: '2024-04-10T19:00:00',
    wardenName: 'Dr. Ramesh Kumar',
    wardenApprovedAt: '2024-04-10T20:30:00',
    createdAt: '2024-04-10T15:00:00',
    exitScannedAt: '2024-04-11T08:10:00',
    qrCode: 'GP-2024-0418-HASH-AN5P6S',
    isLate: true,
  },
  {
    id: 'GP-2024-0417',
    studentId: 'STU004',
    studentName: 'Priya Menon',
    usn: '1DS21CS156',
    room: 'A-410',
    block: 'A Block',
    reason: 'home_visit',
    reasonDetail: 'Weekend home visit to Mysuru.',
    outTime: '2024-04-06T09:00:00',
    expectedReturn: '2024-04-07T21:00:00',
    actualReturn: '2024-04-07T20:30:00',
    status: 'returned',
    parentStatus: 'approved',
    parentApprovedAt: '2024-04-05T20:00:00',
    wardenName: 'Mrs. Anitha Rao',
    wardenApprovedAt: '2024-04-05T21:00:00',
    createdAt: '2024-04-05T16:00:00',
    exitScannedAt: '2024-04-06T09:05:00',
    qrCode: 'GP-2024-0417-HASH-BO6Q7T',
    isLate: false,
  },
  {
    id: 'GP-2024-0416',
    studentId: 'STU006',
    studentName: 'Sneha Iyer',
    usn: '1DS22IS099',
    room: 'B-205',
    block: 'B Block',
    reason: 'medical',
    reasonDetail: 'Dental appointment at Columbia Asia Hospital.',
    outTime: '2024-04-10T14:00:00',
    expectedReturn: '2024-04-10T18:00:00',
    status: 'rejected',
    parentStatus: 'approved',
    parentApprovedAt: '2024-04-10T10:00:00',
    wardenName: 'Mrs. Anitha Rao',
    wardenApprovedAt: '2024-04-10T12:00:00',
    createdAt: '2024-04-10T09:00:00',
    qrCode: 'GP-2024-0416-HASH-CP7R8U',
    isLate: false,
  },
  {
    id: 'GP-2024-0415',
    studentId: 'STU007',
    studentName: 'Rahul Kumar',
    usn: '1DS21CS089',
    room: 'A-312',
    block: 'A Block',
    reason: 'personal',
    reasonDetail: 'Passport work at Regional Passport Office.',
    outTime: '2024-04-13T09:00:00',
    expectedReturn: '2024-04-13T18:00:00',
    status: 'active',
    parentStatus: 'approved',
    parentApprovedAt: '2024-04-12T22:00:00',
    wardenName: 'Dr. Ramesh Kumar',
    wardenApprovedAt: '2024-04-13T08:00:00',
    createdAt: '2024-04-12T18:00:00',
    exitScannedAt: '2024-04-13T09:10:00',
    qrCode: 'GP-2024-0415-HASH-DQ8S9V',
    isLate: false,
  },
];

export interface Warden {
  id: string;
  name: string;
  hostel: string;
  mobile: string;
  email: string;
}

export const mockWardens: Warden[] = [
  {
    id: 'WAR001',
    name: 'Dr. Ramesh Kumar',
    hostel: 'Cauvery Boys Hostel',
    mobile: '9845001234',
    email: 'ramesh.k@dsu.edu',
  },
  {
    id: 'WAR002',
    name: 'Mrs. Anitha Rao',
    hostel: 'Tungabhadra Girls Hostel',
    mobile: '9845002345',
    email: 'anitha.r@dsu.edu',
  },
];

export interface Guard {
  id: string;
  name: string;
  shift: string;
  mobile: string;
}

export const mockGuards: Guard[] = [
  { id: 'GRD001', name: 'Suresh Babu', shift: '06:00 - 14:00', mobile: '9900123456' },
  { id: 'GRD002', name: 'Mohan Das', shift: '14:00 - 22:00', mobile: '9900234567' },
  { id: 'GRD003', name: 'Rajan Pillai', shift: '22:00 - 06:00', mobile: '9900345678' },
];

// Analytics data for admin dashboard
export const dailyPassData = [
  { date: 'Mar 15', passes: 8, approved: 7, rejected: 1 },
  { date: 'Mar 16', passes: 5, approved: 5, rejected: 0 },
  { date: 'Mar 17', passes: 12, approved: 10, rejected: 2 },
  { date: 'Mar 18', passes: 15, approved: 13, rejected: 2 },
  { date: 'Mar 19', passes: 9, approved: 8, rejected: 1 },
  { date: 'Mar 20', passes: 18, approved: 15, rejected: 3 },
  { date: 'Mar 21', passes: 22, approved: 19, rejected: 3 },
  { date: 'Mar 22', passes: 14, approved: 12, rejected: 2 },
  { date: 'Mar 23', passes: 7, approved: 6, rejected: 1 },
  { date: 'Mar 24', passes: 11, approved: 10, rejected: 1 },
  { date: 'Mar 25', passes: 16, approved: 14, rejected: 2 },
  { date: 'Mar 26', passes: 20, approved: 18, rejected: 2 },
  { date: 'Mar 27', passes: 13, approved: 11, rejected: 2 },
  { date: 'Mar 28', passes: 9, approved: 8, rejected: 1 },
  { date: 'Mar 29', passes: 6, approved: 6, rejected: 0 },
  { date: 'Mar 30', passes: 17, approved: 15, rejected: 2 },
  { date: 'Mar 31', passes: 19, approved: 16, rejected: 3 },
  { date: 'Apr 01', passes: 11, approved: 10, rejected: 1 },
  { date: 'Apr 02', passes: 14, approved: 12, rejected: 2 },
  { date: 'Apr 03', passes: 8, approved: 7, rejected: 1 },
  { date: 'Apr 04', passes: 23, approved: 20, rejected: 3 },
  { date: 'Apr 05', passes: 26, approved: 22, rejected: 4 },
  { date: 'Apr 06', passes: 18, approved: 15, rejected: 3 },
  { date: 'Apr 07', passes: 10, approved: 9, rejected: 1 },
  { date: 'Apr 08', passes: 13, approved: 11, rejected: 2 },
  { date: 'Apr 09', passes: 15, approved: 13, rejected: 2 },
  { date: 'Apr 10', passes: 12, approved: 11, rejected: 1 },
  { date: 'Apr 11', passes: 9, approved: 8, rejected: 1 },
  { date: 'Apr 12', passes: 16, approved: 14, rejected: 2 },
  { date: 'Apr 13', passes: 7, approved: 6, rejected: 1 },
];

export const statusBreakdown = [
  { name: 'Approved', value: 342, color: '#10B981' },
  { name: 'Rejected', value: 48, color: '#EF4444' },
  { name: 'Pending', value: 23, color: '#F59E0B' },
  { name: 'Expired', value: 15, color: '#9BA3B2' },
];

export const reasonBreakdown = [
  { reason: 'Home Visit', count: 185 },
  { reason: 'Medical', count: 94 },
  { reason: 'Personal', count: 76 },
  { reason: 'Event', count: 52 },
  { reason: 'Other', count: 21 },
];

export const exitHeatmap = [
  { hour: '6 AM', mon: 2, tue: 1, wed: 3, thu: 2, fri: 4, sat: 8, sun: 12 },
  { hour: '8 AM', mon: 5, tue: 4, wed: 6, thu: 5, fri: 8, sat: 15, sun: 10 },
  { hour: '10 AM', mon: 8, tue: 9, wed: 7, thu: 10, fri: 12, sat: 18, sun: 14 },
  { hour: '12 PM', mon: 6, tue: 7, wed: 8, thu: 6, fri: 9, sat: 12, sun: 8 },
  { hour: '2 PM', mon: 4, tue: 5, wed: 4, thu: 5, fri: 7, sat: 10, sun: 6 },
  { hour: '4 PM', mon: 3, tue: 4, wed: 5, thu: 4, fri: 6, sat: 8, sun: 5 },
  { hour: '6 PM', mon: 2, tue: 3, wed: 2, thu: 3, fri: 5, sat: 6, sun: 4 },
  { hour: '8 PM', mon: 1, tue: 2, wed: 1, thu: 2, fri: 3, sat: 4, sun: 3 },
];

export interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string;
  role: Role;
  action: string;
  entity: string;
  ip: string;
}

export const mockActivityLogs: ActivityLog[] = [
  { id: 'LOG001', timestamp: '2024-04-13T10:15:23', actor: 'Dr. Ramesh Kumar', role: 'warden', action: 'APPROVED_PASS', entity: 'GP-2024-0421', ip: '192.168.1.45' },
  { id: 'LOG002', timestamp: '2024-04-13T09:30:11', actor: 'Harsh Verma', role: 'student', action: 'CREATED_PASS', entity: 'GP-2024-0421', ip: '192.168.1.78' },
  { id: 'LOG003', timestamp: '2024-04-13T09:10:45', actor: 'Riya Sharma', role: 'student', action: 'CREATED_PASS', entity: 'GP-2024-0420', ip: '10.0.0.112' },
  { id: 'LOG004', timestamp: '2024-04-13T08:55:30', actor: 'Suresh Babu', role: 'guard', action: 'SCANNED_EXIT', entity: 'GP-2024-0415', ip: '192.168.1.90' },
  { id: 'LOG005', timestamp: '2024-04-13T08:00:20', actor: 'Dr. Ramesh Kumar', role: 'warden', action: 'APPROVED_PASS', entity: 'GP-2024-0415', ip: '192.168.1.45' },
  { id: 'LOG006', timestamp: '2024-04-12T22:15:00', actor: 'System', role: 'admin', action: 'AUTO_EXPIRED', entity: 'GP-2024-0414', ip: '127.0.0.1' },
  { id: 'LOG007', timestamp: '2024-04-12T20:30:00', actor: 'Mrs. Anitha Rao', role: 'warden', action: 'REJECTED_PASS', entity: 'GP-2024-0416', ip: '192.168.1.46' },
  { id: 'LOG008', timestamp: '2024-04-12T19:45:00', actor: 'Karthik Reddy', role: 'student', action: 'LATE_RETURN', entity: 'GP-2024-0418', ip: '10.0.0.145' },
];

export const mockNotifications = [
  { id: 'N001', message: 'Arjun Nair\'s gate pass needs your approval', time: '5 min ago', type: 'pending', read: false },
  { id: 'N002', message: 'Karthik Reddy returned 2.5 hrs late', time: '3 hrs ago', type: 'alert', read: false },
  { id: 'N003', message: 'Rahul Kumar exit scanned at Gate 1', time: '1 hr ago', type: 'info', read: true },
  { id: 'N004', message: 'Parent approval pending for 3 requests', time: '2 hrs ago', type: 'warning', read: true },
  { id: 'N005', message: 'Priya Menon returned on time', time: '2 days ago', type: 'success', read: true },
];
