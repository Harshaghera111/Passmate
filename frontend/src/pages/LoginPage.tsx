import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, QrCode, AlertCircle, Phone, KeyRound, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../services/authService';
import { ROLE_HOME } from '../routes/ProtectedRoute';

// ─── Test phone numbers (for demo / development) ────────────────────────────
// Student : +91 98450 12345  (OTP: 123456 in emulator)
// Parent  : +91 98765 43210  (OTP: 123456 in emulator)
// Warden  : +91 98450 01234  (OTP: 123456 in emulator)
// Guard   : +91 99000 12345  (OTP: 123456 in emulator)
// Admin   : +91 90000 00001  (OTP: 123456 in emulator)
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  parent:  'Parent / Guardian',
  warden:  'Warden',
  guard:   'Security Guard',
  admin:   'Admin',
};

const LoginPage: React.FC = () => {
  const [params] = useSearchParams();
  const defaultRole = (params.get('role') as UserRole) || 'student';

  const [role, setRole]       = useState<UserRole>(defaultRole);
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState('');
  const [name, setName]       = useState('');

  const recaptchaRef = useRef<HTMLDivElement>(null);
  const { 
    initRecaptcha, sendOtpCode, confirmOtpCode, otpSent, otpLoading, 
    error, clearError, isAuthenticated, user,
  } = useAuthStore();

  const navigate = useNavigate();

  // Redirect if already authed
  useEffect(() => {
    if (isAuthenticated && user) navigate(ROLE_HOME[user.role] ?? '/student/dashboard', { replace: true });
  }, [isAuthenticated, user, navigate]);

  // Setup reCAPTCHA on mount
  useEffect(() => {
    initRecaptcha('recaptcha-container');
  }, [initRecaptcha]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!phone || phone.replace(/\D/g, '').length < 10) return;
    await sendOtpCode(phone.replace(/\D/g, ''));
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const ok = await confirmOtpCode(otp, role, {
      name: name.trim() || undefined,
    });
    if (ok) navigate(ROLE_HOME[role] ?? '/student/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg-base flex selection:bg-accent-primary selection:text-white">
      {/* Left hero panel */}
      <div className="hidden lg:flex w-[45%] bg-gradient-hero p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#10B981]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center">
            <QrCode size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold font-sora">PassMate</span>
        </div>

        <div className="relative z-10 space-y-6 my-auto">
          <h1 className="text-5xl font-extrabold font-sora leading-[1.1] tracking-tight">
            Smart Hostel<br />Gate Pass<br />Management
          </h1>
          <p className="text-blue-100 text-lg max-w-md leading-relaxed">
            Paperless approvals. Real-time tracking. Instant QR exits.<br />
            Built for modern Indian campuses.
          </p>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-400/20 rounded-full flex items-center justify-center flex-shrink-0 border border-emerald-400/30">
                <ShieldCheck size={24} className="text-emerald-300" />
              </div>
              <div>
                <p className="text-white font-bold font-sora">Pass Approved</p>
                <p className="text-blue-100 text-xs mt-0.5">Verified at gate · 2:45 PM</p>
              </div>
              <div className="ml-auto bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider border border-emerald-500/30">
                Active
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-blue-200 font-medium">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-[#2F6FED] backdrop-blur-sm" />
            ))}
          </div>
          <p>Trusted by 50+ Top Colleges</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 md:px-24 relative overflow-hidden">
        <div className="w-full max-w-md mx-auto space-y-8 page-enter">

          {/* Logo (mobile) */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-hero rounded-xl shadow-lg flex items-center justify-center">
              <QrCode size={28} className="text-white" />
            </div>
            <span className="text-3xl font-extrabold text-text-primary font-sora tracking-tight">PassMate</span>
          </div>

          {/* Role selector */}
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([r, label]) => (
              <button
                key={r}
                onClick={() => { setRole(r); clearError(); }}
                disabled={otpSent}
                className={[
                  'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                  role === r
                    ? 'bg-accent-primary text-white border-accent-primary'
                    : 'bg-white text-text-secondary border-border hover:bg-bg-muted',
                  otpSent ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          <div>
            <h2 className="text-3xl font-bold font-sora text-text-primary">
              {otpSent ? 'Enter OTP' : 'Secure Login'}
            </h2>
            <p className="text-text-muted mt-1 text-sm">
              {otpSent
                ? `Code sent to +91 ${phone}. Valid for 2 minutes.`
                : 'Login as ' + ROLE_LABELS[role] + ' using your registered mobile number.'}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl shadow-blue-900/5 border border-border">
            {!otpSent ? (
              /* ── Step 1: Enter phone ── */
              <form onSubmit={handleSendOtp} className="space-y-5">
                {role === 'student' && (
                  <div className="float-label-group">
                    <input
                      type="text" placeholder=" " value={name}
                      onChange={e => setName(e.target.value)}
                    />
                    <label>Full Name (optional for first-time)</label>
                  </div>
                )}

                <div className="float-label-group">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium select-none">+91</span>
                    <input
                      type="tel"
                      placeholder=" "
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="!pl-12"
                      required
                    />
                    <label style={{ left: '3rem' }}>Mobile Number</label>
                  </div>
                </div>

                {/* invisible reCAPTCHA anchor */}
                <div id="recaptcha-container" ref={recaptchaRef} />

                <button
                  type="submit"
                  disabled={otpLoading || phone.length < 10}
                  className="btn btn-primary w-full h-12 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {otpLoading ? 'Sending OTP...' : <><Phone size={16} /> Send OTP</>}
                </button>
              </form>
            ) : (
              /* ── Step 2: Enter OTP ── */
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="flex gap-1 items-center text-sm text-text-secondary mb-2">
                  <button type="button" onClick={() => { useAuthStore.getState().clearError(); useAuthStore.setState({ otpSent: false }); }} className="flex items-center gap-1 hover:text-accent-primary transition-colors">
                    <ChevronLeft size={14} /> Change number
                  </button>
                </div>

                <div className="float-label-group">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder=" "
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    autoFocus
                    required
                  />
                  <label>6-digit OTP</label>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otp.length < 6}
                  className="btn btn-primary w-full h-12 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {otpLoading ? 'Verifying...' : <><KeyRound size={16} /> Verify & Login</>}
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="w-full text-center text-sm text-text-secondary hover:text-accent-primary transition-colors"
                >
                  Resend OTP
                </button>
              </form>
            )}
          </div>

          {/* Demo seed hint */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1">
            <p className="font-bold uppercase tracking-wider text-[10px] text-blue-500 mb-2">Demo Credentials</p>
            <p>📱 Student: <span className="font-mono">+91 98450 12345</span></p>
            <p>👪 Parent: <span className="font-mono">+91 98765 43210</span></p>
            <p>🛡️ Warden: <span className="font-mono">+91 98450 01234</span></p>
            <p>🔒 Guard: <span className="font-mono">+91 99000 12345</span></p>
            <p className="text-blue-400 italic mt-2">OTP: 123456 (Firebase Auth Emulator / Test Numbers)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
