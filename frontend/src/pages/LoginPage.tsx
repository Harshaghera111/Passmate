import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, QrCode, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import OTPInput from '../components/ui/OTPInput';

const ROLE_DEFAULTS = {
  student: { usn: '1DS22CS042', mobile: '9845012345' },
  warden:  { usn: '',          mobile: '9845001234' },
  guard:   { usn: '',          mobile: '9900012345' },
  admin:   { usn: '',          mobile: '9000000001' },
};

const ROLE_ROUTES: Record<string, string> = {
  student: '/student/dashboard',
  warden: '/warden/dashboard',
  guard: '/guard/scan',
  admin: '/admin/dashboard',
};

const LoginPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [usn, setUsn] = useState('1DS22CS042');
  const [mobile, setMobile] = useState('9845012345');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { initiateLogin, verifyOtp, pendingMaskedMobile, devOtp } = useAuthStore();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile) return;
    setError(null);
    setIsLoading(true);
    const ok = await initiateLogin(usn || mobile, mobile);
    setIsLoading(false);
    if (ok) {
      setStep(2);
    } else {
      setError('Invalid credentials. Please check your USN and mobile number.');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return;
    setError(null);
    setIsLoading(true);
    const ok = await verifyOtp(code);
    setIsLoading(false);
    if (ok) {
      // Navigate based on role from newly updated user state
      const store = useAuthStore.getState();
      const role = store.user?.role || 'student';
      navigate(ROLE_ROUTES[role] || '/student/dashboard');
    } else {
      setError('Incorrect OTP. Please try again or use bypass code 123456.');
    }
  };

  const fillDemo = (role: keyof typeof ROLE_DEFAULTS) => {
    const { usn: u, mobile: m } = ROLE_DEFAULTS[role];
    setUsn(u);
    setMobile(m);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-bg-base flex selection:bg-accent-primary selection:text-white">
      {/* Left panel */}
      <div className="hidden lg:flex w-[45%] bg-gradient-hero p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#10B981]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center">
            <QrCode size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold font-sora">PassMate</span>
        </div>

        <div className="relative z-10 space-y-8 mt-12 mb-auto">
          <h1 className="text-5xl font-extrabold font-sora leading-[1.1] tracking-tight">
            Smart Hostel<br />Gate Pass<br />Management
          </h1>
          <p className="text-blue-100 text-lg font-medium max-w-md leading-relaxed">
            Paperless approvals. Real-time tracking. Instant QR exits.<br />
            Built for modern Indian campuses.
          </p>

          <div className="float-card mt-12 relative w-full max-w-sm">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-400/20 rounded-full flex items-center justify-center flex-shrink-0 border border-emerald-400/30">
                  <ShieldCheck size={24} className="text-emerald-300" />
                </div>
                <div>
                  <p className="text-white font-bold font-sora">Pass Approved</p>
                  <p className="text-blue-100 text-xs mt-0.5">Warden Dr. Ramesh</p>
                </div>
                <div className="ml-auto bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider border border-emerald-500/30">
                  Now Active
                </div>
              </div>
            </div>
            <div className="absolute -inset-1 blur-2xl bg-white/10 rounded-3xl -z-10" />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-blue-200 mt-12 font-medium">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-[#2F6FED] backdrop-blur-sm" />
            ))}
          </div>
          <p>Trusted by 50+ Top Colleges</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 md:px-24 relative overflow-hidden">
        <div className="lg:hidden absolute top-0 left-0 w-full h-64 bg-gradient-hero -z-10 rounded-b-[40px] opacity-10" />

        <div className="w-full max-w-md mx-auto space-y-8 page-enter relative z-10">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 bg-gradient-hero rounded-xl shadow-lg flex items-center justify-center">
              <QrCode size={28} className="text-white" />
            </div>
            <span className="text-3xl font-extrabold text-text-primary font-sora tracking-tight mt-1">PassMate</span>
          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-bold font-sora text-text-primary">
              {step === 1 ? 'Welcome back' : 'Verify OTP'}
            </h2>
            <p className="text-text-muted mt-2 text-sm">
              {step === 1
                ? 'Login with your college credentials'
                : `OTP sent to +91 ${pendingMaskedMobile || '****'}`}
            </p>
            {step === 2 && devOtp && (
              <p className="mt-1 text-xs text-emerald-600 font-medium">
                🔑 Dev OTP: <span className="font-mono font-bold">{devOtp}</span> (or use bypass: 123456)
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl shadow-blue-900/5 border border-border">
            {step === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div className="float-label-group">
                  <input type="text" id="usn" placeholder=" " value={usn}
                    onChange={(e) => setUsn(e.target.value.toUpperCase())} />
                  <label htmlFor="usn">University/College ID (USN)</label>
                </div>
                <div className="float-label-group">
                  <input type="tel" id="mobile" placeholder=" " value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    maxLength={10} required />
                  <label htmlFor="mobile">Registered Mobile Number</label>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={isLoading || !mobile || mobile.length < 10}
                    className="btn btn-primary w-full h-12 text-[15px] group disabled:opacity-70 disabled:cursor-not-allowed">
                    {isLoading ? 'Sending OTP...' : 'Continue with College ID'}
                    {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                </div>

                <div className="mt-6 pt-5 border-t border-border">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Quick Demo Login</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => fillDemo('student')} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium hover:bg-blue-100 transition-colors border border-blue-200">Student</button>
                    <button type="button" onClick={() => fillDemo('warden')} className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full font-medium hover:bg-purple-100 transition-colors border border-purple-200">Warden</button>
                    <button type="button" onClick={() => fillDemo('guard')} className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-medium hover:bg-amber-100 transition-colors border border-amber-200">Guard</button>
                    <button type="button" onClick={() => fillDemo('admin')} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-full font-medium hover:bg-red-100 transition-colors border border-red-200">Admin</button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-8">
                <div className="pt-2">
                  <OTPInput value={otp} onChange={setOtp} disabled={isLoading} />
                </div>
                <div className="space-y-4">
                  <button type="submit" disabled={isLoading || otp.join('').length !== 6}
                    className="btn btn-primary w-full h-12 text-[15px] disabled:opacity-70 disabled:cursor-not-allowed">
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <div className="flex justify-between items-center px-1">
                    <button type="button" onClick={() => { setStep(1); setOtp(Array(6).fill('')); setError(null); }}
                      className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                      Change details
                    </button>
                    <span className="text-sm font-medium text-text-muted">Resend OTP (0:45)</span>
                  </div>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-text-muted font-medium pb-6 lg:pb-0">
            Login credentials provided by your hostel warden. Need help?{' '}
            <a href="#" className="text-accent-primary hover:underline">Contact Admin</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
