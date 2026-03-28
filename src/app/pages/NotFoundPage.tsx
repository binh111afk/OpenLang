import { useNavigate } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-purple-50 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950 flex items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center shadow-xl">
            <span className="text-white text-4xl font-bold">404</span>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Trang không tồn tại</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Trang bạn đang tìm kiếm không được tìm thấy. Có thể đường dẫn đã thay đổi hoặc không tồn tại.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg"
          >
            <Home className="w-5 h-5" />
            Trang Chủ
          </button>
        </div>
      </div>
    </div>
  );
}
