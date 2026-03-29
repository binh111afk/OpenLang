import { Check, Globe, Languages, Sun, Moon, Monitor, User, Mail, LogOut, Volume2, Eye, Bell, LogIn, UserPlus, Camera, KeyRound } from 'lucide-react';
import { useEffect, useState, type ChangeEvent } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { AnimatedPage } from '../components/AnimatedPage';
import { AuthModal } from '../components/AuthModal';

export function SettingsPage() {
  const { uiLanguage, learningLanguages, setUILanguage, toggleLearningLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, isLoggedIn, updateName, updateAvatar, updatePassword, updateGoal, logout } = useUser();
  const [authOpen, setAuthOpen] = useState(false);

  // Local editable name state
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [accountMessage, setAccountMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [goalInput, setGoalInput] = useState<number>(user?.goal ?? 15);
  const [goalSaving, setGoalSaving] = useState(false);

  const [passwordInput, setPasswordInput] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setNameInput(user.name);
    setGoalInput(user.goal);
  }, [user]);

  const saveName = async () => {
    if (!nameInput.trim()) {
      setAccountMessage({ type: 'error', text: 'Tên không được để trống.' });
      return;
    }

    setNameSaving(true);
    const result = await updateName(nameInput);
    setNameSaving(false);

    if (!result.ok) {
      setAccountMessage({ type: 'error', text: result.error || 'Không thể cập nhật tên.' });
      return;
    }

    setEditingName(false);
    setAccountMessage({ type: 'success', text: 'Đã cập nhật tên hiển thị.' });
  };

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';

    if (!file) {
      return;
    }

    setAvatarUploading(true);
    const result = await updateAvatar(file);
    setAvatarUploading(false);

    if (!result.ok) {
      setAccountMessage({ type: 'error', text: result.error || 'Không thể tải ảnh đại diện.' });
      return;
    }

    setAccountMessage({ type: 'success', text: 'Đã cập nhật ảnh đại diện.' });
  };

  const saveGoal = async () => {
    setGoalSaving(true);
    const result = await updateGoal(goalInput);
    setGoalSaving(false);

    if (!result.ok) {
      setAccountMessage({ type: 'error', text: result.error || 'Không thể lưu mục tiêu học tập.' });
      return;
    }

    setAccountMessage({ type: 'success', text: 'Đã cập nhật mục tiêu hằng ngày.' });
  };

  const changePassword = async () => {
    if (!passwordInput || !passwordConfirm) {
      setAccountMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ mật khẩu mới và xác nhận.' });
      return;
    }

    if (passwordInput.length < 6) {
      setAccountMessage({ type: 'error', text: 'Mật khẩu mới cần ít nhất 6 ký tự.' });
      return;
    }

    if (passwordInput !== passwordConfirm) {
      setAccountMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setPasswordSaving(true);
    const result = await updatePassword(passwordInput);
    setPasswordSaving(false);

    if (!result.ok) {
      setAccountMessage({ type: 'error', text: result.error || 'Không thể đổi mật khẩu.' });
      return;
    }

    setPasswordInput('');
    setPasswordConfirm('');
    setAccountMessage({ type: 'success', text: 'Đổi mật khẩu thành công.' });
  };

  const handleLogout = async () => {
    await logout();
  };

  // Learning preferences
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [showFurigana, setShowFurigana] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(false);

  const uiLanguageOptions = [
    { value: 'vietnamese' as const, label: 'Tiếng Việt', flag: '🇻🇳' },
    { value: 'english' as const, label: 'English', flag: '🇬🇧' },
  ];

  const learningLanguageOptions = [
    { value: 'english' as const, label: 'Tiếng Anh', nativeLabel: 'English', flag: '🇬🇧', description: 'Học từ vựng và ngữ pháp tiếng Anh' },
    { value: 'japanese' as const, label: 'Tiếng Nhật', nativeLabel: '日本語', flag: '🇯🇵', description: 'Học Kanji, Hiragana, và Katakana' },
  ];

  const themeOptions = [
    { value: 'light' as const, label: 'Chế Độ Sáng', icon: Sun },
    { value: 'dark' as const, label: 'Chế Độ Tối', icon: Moon },
    { value: 'auto' as const, label: 'Tự Động', icon: Monitor },
  ];

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`
        relative w-14 h-7 rounded-full transition-all duration-300
        ${enabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}
      `}
    >
      <div
        className={`
          absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300
          ${enabled ? 'left-7' : 'left-0.5'}
        `}
      />
    </button>
  );

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto p-6 lg:p-10 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Cài Đặt</h1>
          <p className="text-gray-600 dark:text-gray-400">Tùy chỉnh trải nghiệm học tập của bạn</p>
        </div>

        {/* Account Section */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-2xl">
              <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Tài Khoản</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Thông tin cá nhân của bạn</p>
            </div>
          </div>

          {isLoggedIn && user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-950 rounded-2xl">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full border-2 border-purple-300 dark:border-purple-700 object-cover bg-purple-100"
              />
              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-purple-300 px-3 py-2 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900">
                  <Camera className="h-4 w-4" />
                  {avatarUploading ? 'Đang tải ảnh...' : 'Đổi ảnh đại diện'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                    disabled={avatarUploading}
                  />
                </label>
              </div>
              <div className="flex-1">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { void saveName(); }
                        if (e.key === 'Escape') { setNameInput(user.name); setEditingName(false); }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border-2 border-purple-400 dark:border-purple-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-bold text-base focus:outline-none"
                    />
                    <button
                      onClick={() => { void saveName(); }}
                      disabled={nameSaving}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
                    >
                      {nameSaving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                    <button
                      onClick={() => { setNameInput(user.name); setEditingName(false); }}
                      className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{user.name}</p>
                    <button
                      onClick={() => { setNameInput(user.name); setEditingName(true); }}
                      className="text-xs text-purple-500 hover:text-purple-700 dark:hover:text-purple-300 underline"
                    >
                      Sửa
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
              </div>
              <button
                onClick={() => { void handleLogout(); }}
                className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-xl font-semibold hover:bg-red-200 dark:hover:bg-red-800 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Đăng Xuất
              </button>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border-2 border-purple-100 bg-white p-4 dark:border-purple-800 dark:bg-gray-800">
                  <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Mục tiêu từ vựng mỗi ngày</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={goalInput}
                      onChange={(event) => setGoalInput(Number(event.target.value || user.goal || 15))}
                      className="w-full rounded-xl border-2 border-purple-200 px-3 py-2 text-gray-800 focus:border-purple-400 focus:outline-none dark:border-purple-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                    <button
                      onClick={() => { void saveGoal(); }}
                      disabled={goalSaving}
                      className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                    >
                      {goalSaving ? 'Lưu...' : 'Lưu'}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-purple-100 bg-white p-4 dark:border-purple-800 dark:bg-gray-800">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <KeyRound className="h-4 w-4 text-purple-500" />
                    Đổi mật khẩu
                  </div>
                  <div className="space-y-2">
                    <input
                      type="password"
                      placeholder="Mật khẩu mới"
                      value={passwordInput}
                      onChange={(event) => setPasswordInput(event.target.value)}
                      className="w-full rounded-xl border-2 border-purple-200 px-3 py-2 text-gray-800 focus:border-purple-400 focus:outline-none dark:border-purple-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="password"
                      placeholder="Xác nhận mật khẩu mới"
                      value={passwordConfirm}
                      onChange={(event) => setPasswordConfirm(event.target.value)}
                      className="w-full rounded-xl border-2 border-purple-200 px-3 py-2 text-gray-800 focus:border-purple-400 focus:outline-none dark:border-purple-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                    <button
                      onClick={() => { void changePassword(); }}
                      disabled={passwordSaving}
                      className="w-full rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                    >
                      {passwordSaving ? 'Đang đổi...' : 'Đổi mật khẩu'}
                    </button>
                  </div>
                </div>
              </div>

              {accountMessage ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    accountMessage.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {accountMessage.text}
                </div>
              ) : null}
            </div>
          ) : (
            /* Not logged in — show login/register prompt */
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-200 to-violet-300 dark:from-purple-800 dark:to-violet-800 flex items-center justify-center">
                <User className="w-10 h-10 text-purple-500 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-lg">Bạn chưa đăng nhập</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Đăng nhập để lưu tiến độ học tập và đồng bộ dữ liệu
                </p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <button
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-300 dark:hover:shadow-purple-900 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng Nhập
                </button>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 rounded-2xl font-semibold hover:bg-purple-50 dark:hover:bg-purple-950 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  Đăng Ký
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-2xl">
              <Monitor className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Giao Diện</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Chọn giao diện hiển thị</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`
                    flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all
                    ${isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                      : 'border-purple-100 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-800'
                    }
                  `}
                >
                  <div className={`
                    p-4 rounded-2xl
                    ${isSelected ? 'bg-purple-600' : 'bg-purple-100 dark:bg-purple-900'}
                  `}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
                  </div>
                  <span className={`font-semibold text-sm ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {option.label}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Learning Preferences */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-2xl">
              <Languages className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Học Tập</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tùy chỉnh trải nghiệm học tập</p>
            </div>
          </div>

          <div className="space-y-1">
            {/* Auto Play Audio */}
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
                  <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">Tự Động Phát Âm Thanh</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phát âm thanh khi hiển thị flashcard</p>
                </div>
              </div>
              <ToggleSwitch enabled={autoPlayAudio} onChange={() => setAutoPlayAudio(!autoPlayAudio)} />
            </div>

            {/* Show Furigana */}
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
                  <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">Hiển Thị Furigana</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hiện chú thích phiên âm cho Kanji</p>
                </div>
              </div>
              <ToggleSwitch enabled={showFurigana} onChange={() => setShowFurigana(!showFurigana)} />
            </div>

            {/* Daily Reminder */}
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
                  <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">Nhắc Nhở Học Tập Hằng Ngày</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nhận thông báo nhắc nhở vào 8:00 PM</p>
                </div>
              </div>
              <ToggleSwitch enabled={dailyReminder} onChange={() => setDailyReminder(!dailyReminder)} />
            </div>
          </div>
        </div>

        {/* UI Language Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-2xl">
              <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Ngôn Ngữ Giao Diện</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Chọn ngôn ngữ hiển thị của ứng dụng</p>
            </div>
          </div>

          <div className="space-y-3">
            {uiLanguageOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setUILanguage(option.value)}
                className={`
                  w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all
                  ${uiLanguage === option.value 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' 
                    : 'border-purple-100 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.flag}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{option.label}</span>
                </div>
                {uiLanguage === option.value && (
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Learning Languages Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-2xl">
              <Languages className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Ngôn Ngữ Học</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Chọn ngôn ngữ bạn muốn học (có thể chọn nhiều)</p>
            </div>
          </div>

          <div className="space-y-4">
            {learningLanguageOptions.map((option) => {
              const isSelected = learningLanguages.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => toggleLearningLanguage(option.value)}
                  className={`
                    w-full flex items-start justify-between p-6 rounded-2xl border-2 transition-all
                    ${isSelected 
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950' 
                      : 'border-purple-100 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-800'
                    }
                  `}
                >
                  <div className="flex items-start gap-4 text-left">
                    <span className="text-3xl">{option.flag}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800 dark:text-gray-100 text-lg">{option.label}</span>
                        <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">{option.nativeLabel}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                    </div>
                  </div>
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all
                    ${isSelected 
                      ? 'bg-purple-600 border-purple-600' 
                      : 'border-gray-300 dark:border-gray-600'
                    }
                  `}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {learningLanguages.length === 0 && (
            <div className="bg-amber-50 dark:bg-amber-900 border-2 border-amber-200 dark:border-amber-700 rounded-2xl p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                ⚠️ Vui lòng chọn ít nhất một ngôn ngữ để bắt đầu học. Nội dung sẽ được lọc theo ngôn ngữ bạn chọn.
              </p>
            </div>
          )}

          {learningLanguages.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ℹ️ Bạn đang học: {learningLanguages.map(lang => lang === 'english' ? 'Tiếng Anh' : 'Tiếng Nhật').join(', ')}. 
                Tất cả bài đọc, từ vựng và flashcard sẽ chỉ hiển thị nội dung của các ngôn ngữ này.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Spacing */}
        <div className="h-8"></div>
      </div>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </AnimatedPage>
  );
}