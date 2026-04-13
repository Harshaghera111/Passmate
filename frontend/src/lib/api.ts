// api.ts — typed API client for PassMate backend
// Uses VITE_API_URL in production, falls back to localhost:3001 in dev
const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/api';

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
  userId: string;
  maskedMobile: string;
  devOtp?: string;
  message: string;
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

export interface VerifyResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export const authApi = {
  login: (usn: string, mobile: string) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ usn, mobile }) }),

  loginByRole: (role: string) =>
    request<LoginResponse>('/auth/login-role', { method: 'POST', body: JSON.stringify({ role }) }),

  verifyOtp: (userId: string, otp: string) =>
    request<VerifyResponse>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ userId, otp }) }),

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
