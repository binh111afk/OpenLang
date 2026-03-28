import { useRouteError, useNavigate } from 'react-router';
import { Home, RefreshCw } from 'lucide-react';

interface RouteError {
  status?: number;
  statusText?: string;
  message?: string;
  data?: string;
}

export function ErrorPage() {
  const error = useRouteError() as RouteError;
  const navigate = useNavigate();

  const is404 = error?.status === 404;

  const goHome = () => {
    try {
      navigate('/');
    } catch {
      window.location.href = '/';
    }
  };

  const reload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-purple-50 flex items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center shadow-xl">
            <span className="text-white text-3xl font-bold">
              {is404 ? '404' : '!'}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">
            {is404 ? 'Trang không tồn tại' : 'Đã xảy ra lỗi'}
          </h1>
          <p className="text-gray-500">
            {is404
              ? 'Trang bạn đang tìm kiếm không được tìm thấy.'
              : (error?.message || error?.data || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.')}
          </p>
          {error?.status && (
            <p className="text-sm text-purple-600 font-mono">
              Mã lỗi: {error.status} {error.statusText}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reload}
            className="flex items-center gap-2 px-6 py-3 border-2 border-purple-300 text-purple-700 rounded-2xl hover:bg-purple-50 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Tải lại
          </button>
          <button
            onClick={goHome}
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
