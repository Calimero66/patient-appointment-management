import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { registerApi, type RegisterUserData } from '../services/api';
import {
  Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, ShieldCheck,
  UserPlus, CheckCircle2, User, Phone, Calendar, MapPin
} from 'lucide-react';

type Mode = 'login' | 'register';

export function Login() {
  const [mode, setMode] = useState<Mode>('login');

  // Login fields
  const [loginEmail,     setLoginEmail]     = useState('');
  const [loginPassword,  setLoginPassword]  = useState('');
  const [showLoginPwd,   setShowLoginPwd]   = useState(false);
  const [loginError,     setLoginError]     = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Register fields
  const [form, setForm] = useState<RegisterUserData>({
    email: '', password: '', firstName: '', lastName: '',
    phone: '', dateOfBirth: '', gender: 'Male', address: ''
  });
  const [showRegPwd,   setShowRegPwd]   = useState(false);
  const [regError,     setRegError]     = useState('');
  const [regSuccess,   setRegSuccess]   = useState('');
  const [isRegLoading, setIsRegLoading] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const isRegister = mode === 'register';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword.trim()) {
      return setLoginError('Please fill in both fields.');
    }
    setIsLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials.';
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      return setRegError('Please fill in all required fields.');
    }
    if (form.password.length < 6) return setRegError('Password must be at least 6 characters.');
    setIsRegLoading(true);
    try {
      const res = await registerApi({
        email: form.email, password: form.password,
        firstName: form.firstName, lastName: form.lastName,
        phone: form.phone || undefined, dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined, address: form.address || undefined,
      });
      setRegSuccess(res.message || 'Account created! Redirecting to sign in…');
      toast.success('Account created successfully!');
      setTimeout(() => setMode('login'), 1500);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as any).response?.data?.message ?? 'Registration failed.'
          : 'Network error.';
      setRegError(msg);
      toast.error(msg);
    } finally {
      setIsRegLoading(false);
    }
  };

  const inp = 'w-full bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 transition-all font-medium';
  const lbl = 'block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5';

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">

      {/* ═══════════════════════════════════════════
          LEFT — Ministry branding (fixed)
      ═══════════════════════════════════════════ */}
      <div
        className="hidden lg:flex w-[48%] shrink-0 relative flex-col items-center justify-center p-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #003580 0%, #004aad 55%, #1a6e3c 100%)' }}
      >
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-44 h-44 bg-white/5 rounded-full translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-xs space-y-7">
          <div className="bg-white rounded-3xl p-5 shadow-2xl shadow-black/30">
            <img src="/Ministere_de_la_Sante.png" alt="Ministère de la Santé" className="w-32 h-32 object-contain" />
          </div>

          <div className="space-y-1.5">
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.22em]">Royaume du Maroc</p>
            <h1 className="text-white font-extrabold text-xl leading-snug">Ministère de la Santé</h1>
            <p className="text-blue-200 text-sm font-medium">et de la Protection Sociale</p>
          </div>

          <div className="flex items-center gap-3 w-full opacity-25">
            <div className="flex-1 h-px bg-white" />
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            <div className="flex-1 h-px bg-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-white/90 font-bold text-base leading-snug">
              Patient Appointment<br />Management System
            </h2>
            <p className="text-blue-200/70 text-xs leading-relaxed">
              Secure access portal for healthcare professionals and administrative staff.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {['Secure Portal', 'HIPAA Compliant', 'Encrypted'].map(t => (
              <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-white/10 text-white/80 border border-white/20">
                <ShieldCheck size={10} />{t}
              </span>
            ))}
          </div>
        </div>

        <p className="absolute bottom-5 text-white/25 text-[10px] tracking-wider text-center w-full px-4">
          © {new Date().getFullYear()} Ministère de la Santé et de la Protection Sociale — Maroc
        </p>
      </div>

      {/* ═══════════════════════════════════════════
          RIGHT — Form panel with smooth track animation
      ═══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* ── Premium Segmented Control (Pill) ── */}
        <div className="flex justify-center pt-8 pb-3 px-8 shrink-0">
          <div className="relative flex items-center bg-slate-100/90 p-1 w-full max-w-[320px] rounded-2xl border border-slate-200/70 shadow-inner">
            {/* Sliding white pill */}
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200/60 transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                left: '4px',
                transform: isRegister ? 'translateX(100%)' : 'translateX(0%)',
              }}
            />
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`relative z-10 flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-colors duration-200 cursor-pointer text-center ${
                !isRegister ? 'text-[#003580]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`relative z-10 flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-colors duration-200 cursor-pointer text-center ${
                isRegister ? 'text-[#003580]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* ── Sliding Forms Track ── */}
        <div className="flex-1 relative overflow-hidden flex flex-col">

          {/* Mobile logo header */}
          <div className="lg:hidden flex flex-col items-center text-center pt-2 pb-2 shrink-0">
            <div className="bg-white rounded-2xl p-2 shadow border border-slate-200 mb-1">
              <img src="/Ministere_de_la_Sante.png" alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ministère de la Santé</p>
          </div>

          <div
            className="flex w-[200%] flex-1 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              transform: isRegister ? 'translateX(-50%)' : 'translateX(0%)',
            }}
          >
            {/* ── SLIDE 1: LOGIN ── */}
            <div className="w-1/2 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
              <div
                className={`w-full max-w-sm transition-all duration-300 ease-out ${
                  !isRegister ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98] pointer-events-none'
                }`}
              >
                <div className="mb-7">
                  <h2 className="text-2xl font-extrabold text-slate-900">Welcome back</h2>
                  <p className="text-sm text-slate-500 mt-1.5">Enter your credentials to access the portal.</p>
                </div>

                {loginError && (
                  <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm mb-5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className={lbl}>Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      <input
                        type="email"
                        placeholder="name@ministry.gov.ma"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className={`${inp} pl-10 pr-4 py-3`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      <input
                        type={showLoginPwd ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className={`${inp} pl-10 pr-11 py-3`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"
                      >
                        {showLoginPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600" defaultChecked />
                    Remember me
                  </label>

                  <button
                    type="submit"
                    disabled={isLoginLoading}
                    className="w-full py-3 bg-[#003580] hover:bg-[#004aad] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60 cursor-pointer text-sm"
                  >
                    {isLoginLoading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Signing in…</span></>
                    ) : (
                      <><LogIn size={16} /><span>Sign In to Portal</span></>
                    )}
                  </button>
                </form>

                <div className="text-center mt-6 pt-5 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-blue-700 font-bold hover:underline cursor-pointer bg-transparent border-none"
                    >
                      Register here
                    </button>
                  </p>
                </div>

                <p className="text-center text-[10px] text-slate-400 mt-5 leading-relaxed">
                  This portal is reserved for authorized personnel only.<br />
                  Unauthorized access is strictly prohibited.
                </p>
              </div>
            </div>

            {/* ── SLIDE 2: REGISTER ── */}
            <div className="w-1/2 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
              <div
                className={`w-full max-w-sm transition-all duration-300 ease-out ${
                  isRegister ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98] pointer-events-none'
                }`}
              >
                <div className="mb-5">
                  <h2 className="text-2xl font-extrabold text-slate-900">Create Account</h2>
                  <p className="text-sm text-slate-500 mt-1.5">Register to manage your appointments and services.</p>
                </div>

                {regError && (
                  <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm mb-4">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{regError}</span>
                  </div>
                )}
                {regSuccess && (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm mb-4">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" /><span>{regSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>First Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                        <input
                          type="text"
                          name="firstName"
                          placeholder="Jean"
                          value={form.firstName}
                          onChange={handleFormChange}
                          className={`${inp} pl-9 pr-3 py-2.5`}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Last Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                        <input
                          type="text"
                          name="lastName"
                          placeholder="Dupont"
                          value={form.lastName}
                          onChange={handleFormChange}
                          className={`${inp} pl-9 pr-3 py-2.5`}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                      <input
                        type="email"
                        name="email"
                        placeholder="patient@example.com"
                        value={form.email}
                        onChange={handleFormChange}
                        className={`${inp} pl-10 pr-4 py-2.5`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                      <input
                        type={showRegPwd ? 'text' : 'password'}
                        name="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleFormChange}
                        className={`${inp} pl-10 pr-11 py-2.5`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        {showRegPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                        <input
                          type="text"
                          name="phone"
                          placeholder="+212600000000"
                          value={form.phone}
                          onChange={handleFormChange}
                          className={`${inp} pl-9 pr-3 py-2.5`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Date of Birth</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={form.dateOfBirth}
                          onChange={handleFormChange}
                          className={`${inp} pl-9 pr-3 py-2.5`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Gender</label>
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleFormChange}
                        className={`${inp} px-3.5 py-2.5`}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                        <input
                          type="text"
                          name="address"
                          placeholder="Casablanca"
                          value={form.address}
                          onChange={handleFormChange}
                          className={`${inp} pl-9 pr-3 py-2.5`}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRegLoading}
                    className="w-full py-3 bg-[#1a6e3c] hover:bg-[#155c32] text-white font-bold rounded-xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60 cursor-pointer text-sm"
                  >
                    {isRegLoading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Creating account…</span></>
                    ) : (
                      <><UserPlus size={16} /><span>Register Account</span></>
                    )}
                  </button>
                </form>

                <div className="text-center mt-5 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-blue-700 font-bold hover:underline cursor-pointer bg-transparent border-none"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
