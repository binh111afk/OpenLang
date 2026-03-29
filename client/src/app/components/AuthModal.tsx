import { useState } from 'react';
import { X, Eye, EyeOff, User, Lock, Mail, UserPlus, LogIn, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import { LoginSuccessPopup } from './LoginSuccessPopup';

type Mode = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, resetPassword } = useUser();
  const [mode, setMode] = useState<Mode>('login');
  const [successName, setSuccessName] = useState<string | null>(null);

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const resetAll = () => {
    setLoginUsername(''); setLoginPassword(''); setLoginError('');
    setRegEmail(''); setRegName(''); setRegUsername(''); setRegPassword(''); setRegConfirm(''); setRegError('');
    setForgotEmail(''); setForgotSent(false); setForgotError('');
    setMode('login');
  };

  const handleClose = () => { resetAll(); onClose(); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername.trim() || !loginPassword) {
      setLoginError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    setLoginLoading(true);
    const result = await login(loginUsername.trim(), loginPassword);
    setLoginLoading(false);
    if (result.ok) {
      // Show success popup with the user's display name
      const name = result.name ?? loginUsername.trim();
      resetAll();
      setSuccessName(name);
    }
    else setLoginError(result.error || 'Đăng nhập thất bại.');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regEmail.trim() || !regName.trim() || !regUsername.trim() || !regPassword || !regConfirm) {
      setRegError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      setRegError('Email không hợp lệ.'); return;
    }
    if (regPassword.length < 6) {
      setRegError('Mật khẩu phải có ít nhất 6 ký tự.'); return;
    }
    if (regPassword !== regConfirm) {
      setRegError('Mật khẩu xác nhận không khớp.'); return;
    }
    setRegLoading(true);
    const result = await register({ username: regUsername.trim(), password: regPassword, name: regName.trim(), email: regEmail.trim() });
    setRegLoading(false);
    if (result.ok) {
      resetAll();
      setSuccessName(regName.trim());
    }
    else setRegError(result.error || 'Đăng ký thất bại.');
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!forgotEmail.trim()) {
      setForgotError('Vui lòng nhập email.');
      return;
    }

    setForgotLoading(true);
    const result = await resetPassword(forgotEmail.trim());
    setForgotLoading(false);

    if (!result.ok) {
      setForgotError(result.error || 'Không thể gửi email khôi phục mật khẩu.');
      return;
    }

    setForgotSent(true);
  };

  if (!isOpen && !successName) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', damping: 26, stiffness: 380 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 shadow-2xl shadow-purple-200/50 dark:shadow-purple-900/50 overflow-hidden"
            >
              {/* Purple top bar */}
              <div className="h-1.5 bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600" />

              <div className="p-8">
                {/* Close */}
                <button
                  onClick={handleClose}
                  className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <AnimatePresence mode="wait">
                  {/* ── LOGIN ── */}
                  {mode === 'login' && (
                    <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-7">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg shadow-purple-200 dark:shadow-purple-900">
                          <LogIn className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Đăng Nhập</h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Chào mừng trở lại!</p>
                        </div>
                      </div>

                      <form onSubmit={handleLogin} className="space-y-4">
                        {/* Username */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tên đăng nhập</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={loginUsername}
                              onChange={e => setLoginUsername(e.target.value)}
                              placeholder="Nhập tên đăng nhập"
                              className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30 focus:border-purple-400 dark:focus:border-purple-600 focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 transition-colors"
                              autoComplete="username"
                            />
                          </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mật khẩu</label>
                            <button
                              type="button"
                              onClick={() => setMode('forgot')}
                              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline"
                            >
                              Quên mật khẩu?
                            </button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type={showLoginPassword ? 'text' : 'password'}
                              value={loginPassword}
                              onChange={e => setLoginPassword(e.target.value)}
                              placeholder="Nhập mật khẩu"
                              className="w-full pl-11 pr-12 py-3 rounded-2xl border-2 border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30 focus:border-purple-400 dark:focus:border-purple-600 focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 transition-colors"
                              autoComplete="current-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowLoginPassword(v => !v)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                          {loginError && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-sm"
                            >
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              {loginError}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Submit */}
                        <button
                          type="submit"
                          disabled={loginLoading}
                          className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-300 dark:hover:shadow-purple-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loginLoading ? (
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : <LogIn className="w-5 h-5" />}
                          {loginLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                        </button>
                      </form>

                      {/* Register link */}
                      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Bạn chưa có tài khoản?{' '}
                        <button onClick={() => setMode('register')} className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                          Đăng Ký
                        </button>
                      </p>
                    </motion.div>
                  )}

                  {/* ── REGISTER ── */}
                  {mode === 'register' && (
                    <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-200 dark:shadow-purple-900">
                          <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Đăng Ký</h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Tạo tài khoản mới miễn phí</p>
                        </div>
                      </div>

                      <form onSubmit={handleRegister} className="space-y-3.5">
                        {/* Email */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="email"
                              value={regEmail}
                              onChange={e => setRegEmail(e.target.value)}
                              placeholder="example@email.com"
                              className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30 focus:border-purple-400 dark:focus:border-purple-600 focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 transition-colors"
                            />
                          </div>
                        </div>

                        {/* Full name */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Họ và tên</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={regName}
                              onChange={e => setRegName(e.target.value)}
                              placeholder="Nguyễn Văn A"
                              className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30 focus:border-purple-400 dark:focus:border-purple-600 focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 transition-colors"
                            />
                          </div>
                        </div>

                        {/* Username */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tên đăng nhập</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">@</span>
                            <input
                              type="text"
                              value={regUsername}
                              onChange={e => setRegUsername(e.target.value)}
                              placeholder="username"
                              className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30 focus:border-purple-400 dark:focus:border-purple-600 focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 transition-colors"
                            />
                          </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mật khẩu</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              value={regPassword}
                              onChange={e => setRegPassword(e.target.value)}
                              placeholder="Ít nhất 6 ký tự"
                              className="w-full pl-11 pr-12 py-3 rounded-2xl border-2 border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30 focus:border-purple-400 dark:focus:border-purple-600 focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 transition-colors"
                            />
                            <button type="button" onClick={() => setShowRegPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm password */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Xác nhận mật khẩu</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type={showRegConfirm ? 'text' : 'password'}
                              value={regConfirm}
                              onChange={e => setRegConfirm(e.target.value)}
                              placeholder="Nhập lại mật khẩu"
                              className="w-full pl-11 pr-12 py-3 rounded-2xl border-2 border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30 focus:border-purple-400 dark:focus:border-purple-600 focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 transition-colors"
                            />
                            <button type="button" onClick={() => setShowRegConfirm(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                          {regError && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-sm"
                            >
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              {regError}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          type="submit"
                          disabled={regLoading}
                          className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-300 dark:hover:shadow-purple-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {regLoading ? (
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : <UserPlus className="w-5 h-5" />}
                          {regLoading ? 'Đang đăng ký...' : 'Đăng Ký'}
                        </button>
                      </form>

                      <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
                        Đã có tài khoản?{' '}
                        <button onClick={() => setMode('login')} className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                          Đăng Nhập
                        </button>
                      </p>
                    </motion.div>
                  )}

                  {/* ── FORGOT PASSWORD ── */}
                  {mode === 'forgot' && (
                    <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-200 dark:shadow-amber-900">
                          <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Quên Mật Khẩu</h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Khôi phục qua email</p>
                        </div>
                      </div>

                      {forgotSent ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center gap-4 py-6 text-center"
                        >
                          <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                          </div>
                          <p className="font-semibold text-gray-800 dark:text-gray-100">Đã gửi email!</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Kiểm tra hộp thư của <span className="font-semibold text-purple-600 dark:text-purple-400">{forgotEmail}</span> để đặt lại mật khẩu.
                          </p>
                          <button onClick={() => setMode('login')} className="mt-2 text-sm text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                            ← Quay lại đăng nhập
                          </button>
                        </motion.div>
                      ) : (
                        <form onSubmit={handleForgot} className="space-y-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu.
                          </p>
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="email"
                                value={forgotEmail}
                                onChange={e => setForgotEmail(e.target.value)}
                                placeholder="example@email.com"
                                className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30 focus:border-purple-400 dark:focus:border-purple-600 focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 transition-colors"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={forgotLoading}
                            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
                          >
                            {forgotLoading ? 'Đang gửi...' : 'Gửi Link Khôi Phục'}
                          </button>

                          <AnimatePresence>
                            {forgotError && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-sm"
                              >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {forgotError}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </form>
                      )}

                      {!forgotSent && (
                        <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
                          <button onClick={() => setMode('login')} className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                            ← Quay lại đăng nhập
                          </button>
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success popup — shown after login/register, above everything */}
      <LoginSuccessPopup
        isOpen={!!successName}
        userName={successName ?? ''}
        onClose={() => { setSuccessName(null); onClose(); }}
      />
    </>
  );
}