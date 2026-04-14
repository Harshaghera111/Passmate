import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, QrCode, ArrowRight, AlertCircle, Key } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

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
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Registration fields
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  
  // Common fields
  const [usn, setUsn] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { initiateLogin, initiateRegister, initiateLoginByRole, error: storeError, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();
    setIsLoading(true);

    let ok = false;
    if (isLoginMode) {
      if (!usn && !mobile) {
        setIsLoading(false);
        setValidationError('USN or Mobile is required to login.');
        return;
      }
      if (!password) {
        setIsLoading(false);
        setValidationError('Password is required.');
        return;
      }

      const identifier = usn ? usn : mobile;
      ok = await initiateLogin(identifier, password);
    } else {
      if (!name || (!usn && !mobile) || !password) {
        setIsLoading(false);
        setValidationError('Name, identifier (USN or Mobile), and password are required.');
        return;
      }
      ok = await initiateRegister({ name, usn, mobile, room, password });
    }

    setIsLoading(false);
    if (ok) {
      const store = useAuthStore.getState();
      const role = store.user?.role || 'student';
      navigate(ROLE_ROUTES[role] || '/student/dashboard');
    }
  };

  const fillDemo = async (role: keyof typeof ROLE_DEFAULTS) => {
    setIsLoading(true);
    setValidationError(null);
    clearError();
    const ok = await initiateLoginByRole(role);
    setIsLoading(false);
    if (ok) {
      navigate(ROLE_ROUTES[role] || '/student/dashboard');
    } else {
      setValidationError('Demo login failed. Seed data missing?');
    }
  };

  const displayError = validationError || storeError;

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
              {isLoginMode ? 'Welcome back' : 'Create an Account'}
            </h2>
            <p className="text-text-muted mt-2 text-sm">
              {isLoginMode ? 'Login with your credentials' : 'Register your details to get started'}
            </p>
          </div>

          {displayError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0" />
              {displayError}
            </div>
          )}

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl shadow-blue-900/5 border border-border">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLoginMode && (
                <div className="float-label-group">
                  <input type="text" id="name" placeholder=" " value={name}
                    onChange={(e) => setName(e.target.value)} required />
                  <label htmlFor="name">Full Name</label>
                </div>
              )}
              
              <div className="float-label-group">
                <input type="text" id="usn" placeholder=" " value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())} required={!isLoginMode} />
                <label htmlFor="usn">University/College ID (USN) or Mobile</label>
              </div>

              {!isLoginMode && (
                <div className="float-label-group">
                  <input type="tel" id="mobile" placeholder=" " value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    maxLength={10} required />
                  <label htmlFor="mobile">Registered Mobile Number</label>
                </div>
              )}

              {!isLoginMode && (
                <div className="float-label-group">
                  <input type="text" id="room" placeholder=" " value={room}
                    onChange={(e) => setRoom(e.target.value)} />
                  <label htmlFor="room">Room Number (Optional)</label>
                </div>
              )}

              <div className="float-label-group">
                <input type="password" id="password" placeholder=" " value={password}
                  onChange={(e) => setPassword(e.target.value)} required />
                <label htmlFor="password">Password</label>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isLoading}
                  className="btn btn-primary w-full h-12 text-[15px] group disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                  {isLoading ? 'Processing...' : (isLoginMode ? 'Login Securely' : 'Create Account')}
                  {!isLoading && (isLoginMode ? <Key size={18} /> : <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />)}
                </button>
              </div>

              <div className="text-center pt-2">
                <button type="button" onClick={() => { setIsLoginMode(!isLoginMode); setValidationError(null); clearError(); }} className="text-sm font-medium text-text-secondary hover:text-accent-primary transition-colors">
                  {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                </button>
              </div>

              {isLoginMode && (
                <div className="mt-6 pt-5 border-t border-border">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Quick Demo Login</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => fillDemo('student')} disabled={isLoading} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium hover:bg-blue-100 transition-colors border border-blue-200">Student</button>
                    <button type="button" onClick={() => fillDemo('warden')} disabled={isLoading} className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full font-medium hover:bg-purple-100 transition-colors border border-purple-200">Warden</button>
                    <button type="button" onClick={() => fillDemo('guard')} disabled={isLoading} className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-medium hover:bg-amber-100 transition-colors border border-amber-200">Guard</button>
                    <button type="button" onClick={() => fillDemo('admin')} disabled={isLoading} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-full font-medium hover:bg-red-100 transition-colors border border-red-200">Admin</button>
                  </div>
                </div>
              )}
            </form>
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
