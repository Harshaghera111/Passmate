import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, QrCode, AlertCircle, Phone, KeyRound, ChevronLeft, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../services/authService';
import { ROLE_HOME } from '../routes/ProtectedRoute';

// ─── Demo / test phone number ─────────────────────────────────────────────────
// Add this number in Firebase Console → Authentication → Sign-in method
// → Phone → Test phone numbers → +917620981982 / OTP: 123456
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_PHONE = '7620981982';

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  parent:  'Parent / Guardian',
  warden:  'Warden',
  guard:   'Security Guard',
  admin:   'Admin',
};

const RECAPTCHA_ID = 'recaptcha-container';

const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = (searchParams.get('role') as UserRole) || 'student';

  const [role, setRole]   = useState<UserRole>(defaultRole);
  const [phone, setPhone] = useState(DEMO_PHONE);   // pre-filled
  const [otp, setOtp]     = useState('');
  const [name, setName]   = useState('');

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    setupRecaptcha,
    teardownRecaptcha,
    resetOtpState,
    sendOtpCode,
    confirmOtpCode,
    otpSent,
    otpLoading,
    error,
    clearError,
    isAuthenticated,
    user,
  } = useAuthStore();

  // ── Redirect if already authenticated ──────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROLE_HOME[user.role] ?? '/student/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // ── Initialize reCAPTCHA on mount, cleanup on unmount ──────────────────────
  useEffect(() => {
    setupRecaptcha(RECAPTCHA_ID);
    return () => teardownRecaptcha();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-initialize reCAPTCHA when going back to phone step
  // (reCAPTCHA is consumed after each sendOtp call)
  const reinitRecaptcha = () => {
    setupRecaptcha(RECAPTCHA_ID);
  };

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return;
    await sendOtpCode(digits, role);
  };

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const ok = await confirmOtpCode(otp.trim(), role, {
      name: name.trim() || undefined,
    });
    if (ok) navigate(ROLE_HOME[role] ?? '/student/dashboard', { replace: true });
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResend = async () => {
    clearError();
    setOtp('');
    resetOtpState();
    reinitRecaptcha();
    // Give DOM a tick to re-render the container before initializing
    await new Promise(r => setTimeout(r, 100));
    const digits = phone.replace(/\D/g, '');
    await sendOtpCode(digits, role);
  };

  // ── Go back to phone entry ──────────────────────────────────────────────────
  const handleBack = () => {
    clearError();
    setOtp('');
    resetOtpState();
    reinitRecaptcha();
  };

  return (
    <div className="min-h-screen bg-bg-base flex selection:bg-accent-primary selection:text-white">

      {/* ── Left hero panel ── */}
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

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 md:px-24 relative overflow-hidden">
        <div className="w-full max-w-md mx-auto space-y-6 page-enter">

          {/* Logo (mobile only) */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-hero rounded-xl shadow-lg flex items-center justify-center">
              <QrCode size={28} className="text-white" />
            </div>
            <span className="text-3xl font-extrabold text-text-primary font-sora tracking-tight">PassMate</span>
          </div>

          {/* Role selector — disabled once OTP is sent */}
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([r, label]) => (
              <button
                key={r}
                onClick={() => { setRole(r); clearError(); }}
                disabled={otpSent}
                className={[
                  'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                  role === r
                    ? 'bg-accent-primary text-white border-accent-primary shadow-sm'
                    : 'bg-white text-text-secondary border-border hover:bg-bg-muted',
                  otpSent ? 'opacity-40 cursor-not-allowed' : '',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-3xl font-bold font-sora text-text-primary">
              {otpSent ? 'Enter OTP' : 'Secure Login'}
            </h2>
            <p className="text-text-muted mt-1 text-sm">
              {otpSent
                ? `6-digit code sent to +91 ${phone}. Valid for 10 minutes.`
                : `Login as ${ROLE_LABELS[role]} via mobile OTP.`}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-in slide-in-from-top-2 duration-200">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl shadow-blue-900/5 border border-border">
            {!otpSent ? (
              /* ── Step 1: Enter phone number ── */
              <form onSubmit={handleSendOtp} className="space-y-5" noValidate>

                {role === 'student' && (
                  <div className="float-label-group">
                    <input
                      id="name"
                      type="text"
                      placeholder=" "
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                    <label htmlFor="name">Full Name (optional for first-time)</label>
                  </div>
                )}

                {/* Phone input with +91 prefix */}
                <div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-semibold select-none pointer-events-none z-10">
                      +91
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="Mobile number"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full pl-12 pr-4 py-3 border border-border rounded-input text-sm focus:border-accent-primary focus:outline-none focus:shadow-[0_0_0_3px_rgba(47,111,237,0.1)] transition-all bg-white font-mono tracking-wider"
                      maxLength={10}
                      required
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-text-muted pl-1">
                    💡 Demo number pre-filled — use for demo login
                  </p>
                </div>

                {/* Invisible reCAPTCHA anchor — must be in DOM before sendOtp */}
                <div id={RECAPTCHA_ID} ref={recaptchaContainerRef} />

                <button
                  type="submit"
                  disabled={otpLoading || phone.replace(/\D/g, '').length < 10}
                  className="btn btn-primary w-full h-12 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {otpLoading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending OTP...</>
                    : <><Phone size={16} /> Send OTP</>}
                </button>
              </form>
            ) : (
              /* ── Step 2: Enter OTP ── */
              <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>

                {/* Back to phone */}
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={otpLoading}
                  className="flex items-center gap-1 text-sm text-text-secondary hover:text-accent-primary transition-colors disabled:opacity-50"
                >
                  <ChevronLeft size={14} /> Change number
                </button>

                {/* 6-digit OTP input */}
                <div className="float-label-group">
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder=" "
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    autoFocus
                    required
                    className="tracking-[0.5em] text-center font-mono text-lg"
                  />
                  <label htmlFor="otp">6-digit OTP</label>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otp.length < 6}
                  className="btn btn-primary w-full h-12 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {otpLoading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                    : <><KeyRound size={16} /> Verify &amp; Login</>}
                </button>

                {/* Resend */}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={otpLoading}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-text-secondary hover:text-accent-primary transition-colors disabled:opacity-50 pt-1"
                >
                  <RefreshCw size={13} /> Resend OTP
                </button>
              </form>
            )}
          </div>

          {/* Demo hint */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 space-y-1">
            <p className="font-bold uppercase tracking-wider text-[10px] text-amber-600 mb-2">🔬 Demo Login</p>
            <p>
              Phone: <span className="font-mono font-semibold">+91 {DEMO_PHONE}</span>
              <span className="ml-2 text-amber-500">(pre-filled above)</span>
            </p>
            <p className="text-amber-600 mt-1">
              Add this number as a <strong>test phone number</strong> in Firebase Console
              with OTP <code className="bg-amber-100 px-1 rounded">123456</code> to skip real SMS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
