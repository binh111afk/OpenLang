import { ImagePlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDeck: (deckData: DeckData) => Promise<{
    id: string;
    coverImage?: string;
  } | null>;
}

export interface DeckData {
  name: string;
  language: 'english' | 'japanese';
  coverImage?: string;
  rating: number;
}

export function CreateDeckModal({ isOpen, onClose, onCreateDeck }: CreateDeckModalProps) {
  const navigate = useNavigate();
  const [deckName, setDeckName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'japanese'>('english');
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [rating, setRating] = useState(3);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setDeckName('');
    setSelectedLanguage('english');
    setCoverImage(undefined);
    setRating(3);
    setHoverRating(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn đúng file ảnh.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setCoverImage(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deckName.trim()) {
      alert('Vui lòng nhập tên bộ thẻ!');
      return;
    }

    const deckData: DeckData = {
      name: deckName,
      language: selectedLanguage,
      coverImage,
      rating: rating,
    };

    setIsSubmitting(true);

    try {
      const createdDeck = await onCreateDeck(deckData);

      if (!createdDeck?.id) {
        return;
      }

      navigate('/decks/add-cards', {
        state: {
          deckName: deckName,
          language: selectedLanguage,
          deckCoverImage: createdDeck.coverImage || coverImage,
          deckRating: rating,
          deckId: createdDeck.id,
          mode: 'add',
        },
      });

      resetForm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[620px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-purple-100 dark:border-purple-900">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Tạo bộ thẻ mới
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Xây dựng bộ từ vựng của riêng bạn
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-purple-100 dark:hover:bg-purple-950 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Deck Name Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Tên bộ thẻ <span className="text-purple-600">*</span>
                </label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="VD: Từ vựng chuyên ngành IT"
                  className="w-full px-4 py-3 bg-purple-50 dark:bg-purple-950 border-2 border-purple-200 dark:border-purple-800 rounded-2xl text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Language Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Ngôn ngữ học
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as 'english' | 'japanese')}
                  className="w-full px-4 py-3 bg-purple-50 dark:bg-purple-950 border-2 border-purple-200 dark:border-purple-800 rounded-2xl text-gray-800 dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer"
                >
                  <option value="english">🇬🇧 Tiếng Anh</option>
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                </select>
              </div>

              {/* Cover Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Ảnh đại diện bộ thẻ
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-purple-50/80 p-4 dark:border-purple-800 dark:bg-purple-950/60">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center rounded-2xl border border-purple-200 bg-white px-4 py-3 text-sm font-semibold text-purple-700 transition-all hover:border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:bg-gray-900 dark:text-purple-300 dark:hover:bg-purple-950"
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {coverImage ? 'Đổi ảnh đại diện' : 'Tải ảnh lên'}
                  </button>

                  <div className="relative mt-4 overflow-hidden rounded-[24px] border border-purple-200 bg-white shadow-sm dark:border-purple-800 dark:bg-gray-900">
                    {coverImage ? (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition hover:bg-white hover:text-purple-600 dark:bg-gray-900/90 dark:text-gray-300 dark:hover:text-purple-300"
                        title="Xóa ảnh hiện tại"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                    <div className="aspect-[16/10] w-full bg-gradient-to-br from-purple-100 via-violet-50 to-white dark:from-purple-950 dark:via-violet-950 dark:to-gray-900">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt="Ảnh đại diện bộ thẻ"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
                          <div className="mb-3 rounded-2xl bg-purple-100 p-4 dark:bg-purple-900/70">
                            <ImagePlus className="h-8 w-8 text-purple-600 dark:text-purple-300" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Chưa có ảnh đại diện
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Ảnh này sẽ hiển thị ở tab Thư viện cho bộ thẻ của bạn.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Đánh giá độ khó
                </label>
                <div className="flex items-center gap-1 p-4 bg-purple-50 dark:bg-purple-950 border-2 border-purple-200 dark:border-purple-800 rounded-2xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-all hover:scale-110 active:scale-95"
                    >
                      <svg
                        className={`w-10 h-10 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 stroke-yellow-500'
                            : 'fill-gray-300 dark:fill-gray-700 stroke-gray-400 dark:stroke-gray-600'
                        }`}
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Đã chọn: </span>
                  <span className="font-bold text-yellow-600 dark:text-yellow-400">{rating} sao</span>
                  <span className="text-xs">
                    {rating === 1 && '(Rất dễ)'}
                    {rating === 2 && '(Dễ)'}
                    {rating === 3 && '(Trung bình)'}
                    {rating === 4 && '(Khó)'}
                    {rating === 5 && '(Rất khó)'}
                  </span>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-70 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo bộ thẻ ngay'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
