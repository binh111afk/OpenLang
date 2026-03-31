import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakGainPopupProps {
  isOpen: boolean;
  streakDelta: number;
  pending?: boolean;
  currentStreak: number;
  onClose: () => void;
}

export function StreakGainPopup({ isOpen, streakDelta, pending = false, currentStreak, onClose }: StreakGainPopupProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(onClose, 2800);
    return () => window.clearTimeout(timer);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="relative z-10 w-full max-w-sm rounded-3xl border-2 border-orange-200 bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg">
              <Flame className="h-6 w-6" />
            </div>

            <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">{pending ? 'New Day' : 'Streak Updated'}</p>
            <h3 className="mt-1 text-3xl font-bold text-gray-900">+{Math.max(1, streakDelta)} streak</h3>
            <p className="mt-2 text-gray-600">
              {pending
                ? 'Hoàn thành bài học đầu tiên hôm nay để nhận +streak.'
                : `Bạn đã duy trì chuỗi học tập. Chuỗi hiện tại: ${currentStreak} ngày.`}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
