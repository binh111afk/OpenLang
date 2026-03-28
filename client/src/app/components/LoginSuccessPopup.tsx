import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Sparkles, Trophy } from 'lucide-react';

interface LoginSuccessPopupProps {
  isOpen: boolean;
  userName: string;
  onClose: () => void;
}

// ── Confetti particle shapes ──────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#7c3aed', '#a78bfa', '#c4b5fd',  // purples
  '#ddd6fe', '#f9a8d4', '#fb923c',  // lavender, pink, orange
  '#34d399', '#fbbf24', '#60a5fa',  // green, yellow, blue
];

interface Particle {
  id: number;
  x: number;       // % from left
  color: string;
  size: number;
  delay: number;
  duration: number;
  shape: 'circle' | 'rect' | 'star' | 'triangle';
  rotateEnd: number;
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: randomBetween(5, 95),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: randomBetween(7, 16),
    delay: randomBetween(0, 0.6),
    duration: randomBetween(1.4, 2.4),
    shape: (['circle', 'rect', 'star', 'triangle'] as const)[Math.floor(Math.random() * 4)],
    rotateEnd: randomBetween(-360, 360),
  }));
}

function ParticleShape({ shape, size, color }: { shape: Particle['shape']; size: number; color: string }) {
  if (shape === 'circle') {
    return <circle cx={size / 2} cy={size / 2} r={size / 2} fill={color} />;
  }
  if (shape === 'rect') {
    return <rect width={size} height={size * 0.55} rx={2} fill={color} />;
  }
  if (shape === 'triangle') {
    const h = size * 0.866;
    return <polygon points={`${size / 2},0 ${size},${h} 0,${h}`} fill={color} />;
  }
  // star
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? size / 2 : size / 4;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${size / 2 + r * Math.cos(angle)},${size / 2 + r * Math.sin(angle)}`);
  }
  return <polygon points={pts.join(' ')} fill={color} />;
}

function Confetti({ particles }: { particles: Particle[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}%`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: '110%', opacity: [1, 1, 0], rotate: p.rotateEnd, scale: [1, 1, 0.4] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <svg width={p.size} height={p.size} viewBox={`0 0 ${p.size} ${p.size}`}>
            <ParticleShape shape={p.shape} size={p.size} color={p.color} />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

// ── Animated ring burst SVG ───────────────────────────────────────────────
function BurstRings() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 320" fill="none">
      {[1, 2, 3].map((i) => (
        <motion.circle
          key={i}
          cx={160} cy={130}
          r={50 + i * 24}
          stroke={i === 1 ? '#a78bfa' : i === 2 ? '#c4b5fd' : '#ddd6fe'}
          strokeWidth={3 - i * 0.6}
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: [0.6, 1.5], opacity: [0.8, 0] }}
          transition={{ duration: 1.1, delay: 0.2 + i * 0.15, ease: 'easeOut' }}
          style={{ transformOrigin: '160px 130px' }}
        />
      ))}
    </svg>
  );
}

// ── Floating sparkle icons ────────────────────────────────────────────────
const SPARKLE_POSITIONS = [
  { top: '12%', left: '8%', delay: 0.1, size: 18, color: '#fbbf24' },
  { top: '8%', right: '10%', delay: 0.25, size: 14, color: '#a78bfa' },
  { top: '38%', left: '4%', delay: 0.4, size: 12, color: '#f9a8d4' },
  { top: '35%', right: '5%', delay: 0.3, size: 16, color: '#34d399' },
  { bottom: '22%', left: '7%', delay: 0.5, size: 13, color: '#fb923c' },
  { bottom: '18%', right: '8%', delay: 0.45, size: 15, color: '#60a5fa' },
];

function FloatingSparkles() {
  return (
    <>
      {SPARKLE_POSITIONS.map((pos, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', ...pos } as React.CSSProperties}
          initial={{ opacity: 0, scale: 0, rotate: -30 }}
          animate={{ opacity: [0, 1, 0.7, 0], scale: [0, 1.2, 1, 0], rotate: ['-30deg', '20deg', '-10deg', '30deg'] }}
          transition={{ duration: 1.8, delay: pos.delay, ease: 'easeInOut' }}
        >
          <Star fill={pos.color} color={pos.color} style={{ width: pos.size, height: pos.size }} />
        </motion.div>
      ))}
    </>
  );
}

// ── Progress bar auto-close ───────────────────────────────────────────────
function AutoCloseBar({ duration, onDone }: { duration: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);

  return (
    <div className="w-full h-1 bg-purple-100 dark:bg-purple-900 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </div>
  );
}

// ── Main popup ────────────────────────────────────────────────────────────
const AUTO_CLOSE_MS = 3200;

export function LoginSuccessPopup({ isOpen, userName, onClose }: LoginSuccessPopupProps) {
  const [particles] = useState(() => generateParticles(48));
  // First name
  const firstName = userName.split(' ').pop() || userName;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            className="relative z-10 w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 shadow-2xl shadow-purple-300/40 dark:shadow-purple-900/60 overflow-hidden"
          >
            {/* Confetti */}
            <Confetti particles={particles} />

            {/* Burst rings */}
            <BurstRings />

            {/* Floating sparkles */}
            <FloatingSparkles />

            {/* Top gradient strip */}
            <div className="h-1.5 bg-gradient-to-r from-purple-400 via-violet-500 to-purple-600" />

            <div className="relative px-8 pt-8 pb-7 text-center">
              {/* Trophy icon with animated bounce */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: [0, 1.25, 1], rotate: [-20, 10, 0] }}
                transition={{ duration: 0.7, delay: 0.1, type: 'spring', damping: 14 }}
                className="flex justify-center mb-5"
              >
                <div className="relative">
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-full bg-purple-400/30 dark:bg-purple-600/30 blur-xl scale-150" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-purple-300 dark:shadow-purple-900">
                    <Trophy className="w-12 h-12 text-white drop-shadow-md" />
                    {/* Shine */}
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: [0, 0.6, 0], x: 30 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    />
                  </div>
                  {/* Mini sparkle badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.55, type: 'spring', damping: 12 }}
                    className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Texts */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.45 }}
                className="space-y-2 mb-6"
              >
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Chào mừng trở lại! 🎉
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Đăng nhập thành công,{' '}
                  <span className="font-bold bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
                    {firstName}
                  </span>
                  !
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Hãy tiếp tục hành trình học ngôn ngữ của bạn nhé 🚀
                </p>
              </motion.div>

              {/* Stars row */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.35 }}
                className="flex items-center justify-center gap-1.5 mb-6"
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 + i * 0.07 }}
                  >
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Continue button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={onClose}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-purple-300 dark:hover:shadow-purple-900 transition-shadow"
              >
                Bắt đầu học thôi! →
              </motion.button>

              {/* Auto-close bar */}
              <div className="mt-4">
                <AutoCloseBar duration={AUTO_CLOSE_MS} onDone={onClose} />
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5">
                  Tự động đóng sau vài giây...
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
