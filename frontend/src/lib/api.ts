// api.ts — typed API client for PassMate backend
// Production (Vercel): /api routes to the serverless function on the same domain
// Local dev: points to localhost:3001 (run backend separately)
// Custom backend: set VITE_API_URL env var to override
const BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL + '/api'
  : import.meta.env.PROD
    ? '/api'                     // same-domain Vercel serverless
    : 'http://localhost:3001/api'; // local dev backend

function getToken(): string | null {
  return localStorage.getItem('passmate_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  name: string;
  role: 'student' | 'warden' | 'guard' | 'admin';
  usn: string | null;
  mobile: string;
  room: string | null;
  hostel: string | null;
  hostelId: string | null;
}



export const authApi = {
  login: (usn: string, password?: string) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ usn, password }) }),

  register: (data: { name: string; usn?: string; mobile: string; room?: string; password?: string }) =>
    request<LoginResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  loginByRole: (role: string) =>
    request<LoginResponse>('/auth/login-role', { method: 'POST', body: JSON.stringify({ role }) }),

  me: () => request<AuthUser>('/auth/me'),
};

// ─── Pass types ─────────────────────────────────────────────────────────────

export interface GatePass {
  id: string;
  student_id: string;
  reason: string;
  reason_detail: string;
  out_time: string;
  expected_return: string;
  actual_return?: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'returned' | 'expired';
  parent_status: 'pending' | 'approved' | 'rejected';
  parentStatus: 'pending' | 'approved' | 'rejected';
  parent_approved_at?: string;
  warden_id?: string;
  warden_note?: string;
  warden_approved_at?: string;
  exit_scanned_at?: string;
  is_late: boolean;
  isLate: boolean;
  qr_code?: string;
  created_at: string;
  // enriched
  studentName?: string;
  usn?: string;
  room?: string;
  block?: string;
  hostel?: string;
  wardenName?: string;
  reasonDetail?: string;
  outTime?: string;
  expectedReturn?: string;
  actualReturn?: string;
  parentApprovedAt?: string;
  exitScannedAt?: string;
  createdAt?: string;
  title?: string;
}

export interface CreatePassInput {
  reason: string;
  reasonDetail: string;
  outTime: string;
  expectedReturn: string;
}

export const passApi = {
  list: (params?: { status?: string; studentId?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<GatePass[]>(`/passes${qs ? '?' + qs : ''}`);
  },

  get: (id: string) => request<GatePass>(`/passes/${id}`),

  getParentPass: (id: string, token: string) => 
    request<GatePass>(`/passes/parent/${id}?token=${token}`),

  create: (data: CreatePassInput) =>
    request<GatePass>('/passes', { method: 'POST', body: JSON.stringify(data) }),

  wardenApprove: (id: string, note?: string) =>
    request<GatePass>(`/passes/${id}/warden-approve`, { method: 'PATCH', body: JSON.stringify({ note }) }),

  wardenReject: (id: string, note?: string) =>
    request<{ success: boolean }>(`/passes/${id}/warden-reject`, { method: 'PATCH', body: JSON.stringify({ note }) }),

  parentApprove: (id: string, token: string, action: 'approve' | 'reject', note?: string) =>
    request<{ success: boolean; message: string }>(`/passes/${id}/parent-approve`, { method: 'PATCH', body: JSON.stringify({ token, action, note }) }),

  scanExit: (id: string) =>
    request<{ success: boolean }>(`/passes/${id}/scan-exit`, { method: 'PATCH' }),

  scanEntry: (id: string) =>
    request<{ success: boolean; isLate: boolean }>(`/passes/${id}/scan-entry`, { method: 'PATCH' }),

  verify: (passId: string) =>
    request<{ valid: boolean; pass: GatePass }>(`/passes/verify/${passId}`),
};

// ─── Admin ──────────────────────────────────────────────────────────────────

export interface Analytics {
  kpis: { totalStudents: number; passesToday: number; lateReturns: number; highViolations: number };
  statusBreakdown: { name: string; value: number; color: string }[];
  reasonBreakdown: { reason: string; count: number }[];
  dailyPassData: { date: string; total: number; approved: number; rejected: number }[];
}

export const adminApi = {
  analytics: () => request<Analytics>('/admin/analytics'),
  logs: (params?: { limit?: number; offset?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ logs: any[]; total: number }>(`/admin/logs${qs ? '?' + qs : ''}`);
  },
  violations: () => request<any[]>('/admin/violations'),
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const userApi = {
  list: (params?: { role?: string; hostelId?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<any[]>(`/users${qs ? '?' + qs : ''}`);
  },
  get: (id: string) => request<any>(`/users/${id}`),
  passes: (id: string) => request<GatePass[]>(`/users/${id}/passes`),
  create: (data: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
};
