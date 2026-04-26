import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Home, BookOpen, QrCode, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ROLE_HOME } from '../routes/ProtectedRoute';

const HOSTEL_OPTIONS = [
  'Block A', 'Block B', 'Block C', 'Block D',
  'Boys Hostel', 'Girls Hostel', 'PG Block',
];

const CompleteProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, completeProfile, otpLoading, error, clearError } = useAuthStore();

  const [name,   setName]   = useState('');
  const [room,   setRoom]   = useState('');
  const [hostel, setHostel] = useState('');
  const [usn,    setUsn]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!name.trim() || !room.trim() || !hostel) return;

    const ok = await completeProfile({
      name:   name.trim(),
      room:   room.trim(),
      hostel: hostel || undefined,
      usn:    usn.trim() || undefined,
    });

    if (ok && user) {
      navigate(ROLE_HOME[user.role] ?? '/student/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg page-enter">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-accent-primary to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <QrCode size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold font-sora text-text-primary">Complete Your Profile</h1>
          <p className="text-text-muted mt-2 max-w-sm mx-auto">
            You're almost in! Fill in a few details to set up your PassMate identity.
          </p>

          {/* Phone badge */}
          {user?.phone && (
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-700">
              <CheckCircle2 size={12} />
              Verified: {user.phone}
            </div>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-border p-6 sm:p-8">

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 mb-5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Full Name */}
            <div className="float-label-group">
              <div className="relative">
                <User size={15} className="absolute left-3 top-[22px] text-text-muted z-10 pointer-events-none" />
                <input
                  id="profile-name"
                  type="text"
                  placeholder=" "
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="pl-9"
                  required
                  autoFocus
                />
                <label htmlFor="profile-name" className="pl-9">Full Name *</label>
              </div>
            </div>

            {/* Room Number */}
            <div className="float-label-group">
              <div className="relative">
                <Home size={15} className="absolute left-3 top-[22px] text-text-muted z-10 pointer-events-none" />
                <input
                  id="profile-room"
                  type="text"
                  placeholder=" "
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  className="pl-9"
                  required
                />
                <label htmlFor="profile-room" className="pl-9">Room Number *</label>
              </div>
            </div>

            {/* Hostel Block */}
            <div className="float-label-group">
              <select
                id="profile-hostel"
                value={hostel}
                onChange={e => setHostel(e.target.value)}
                required
              >
                <option value="" disabled>Select hostel block *</option>
                {HOSTEL_OPTIONS.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <label htmlFor="profile-hostel">Hostel Block *</label>
            </div>

            {/* USN — only for students */}
            {(user?.role === 'student' || !user?.role) && (
              <div className="float-label-group">
                <div className="relative">
                  <BookOpen size={15} className="absolute left-3 top-[22px] text-text-muted z-10 pointer-events-none" />
                  <input
                    id="profile-usn"
                    type="text"
                    placeholder=" "
                    value={usn}
                    onChange={e => setUsn(e.target.value.toUpperCase())}
                    className="pl-9 font-mono tracking-wider"
                  />
                  <label htmlFor="profile-usn" className="pl-9">USN / Enrollment No.</label>
                </div>
              </div>
            )}

            {/* Progress visual */}
            <div className="bg-bg-muted rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Profile Completion</p>
              <div className="flex gap-1.5">
                {[
                  !!name.trim(),
                  !!room.trim(),
                  !!hostel,
                  !!(user?.role === 'student' && usn.trim()),
                ].map((done, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${done ? 'bg-accent-primary' : 'bg-border'}`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={otpLoading || !name.trim() || !room.trim() || !hostel}
              className="btn btn-primary w-full h-12 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {otpLoading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle2 size={18} /> Save & Enter Dashboard</>
              )}
            </button>

            <p className="text-center text-xs text-text-muted">
              * Required fields. You can update your profile anytime.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
