import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  itemLabel = 'mục',
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Build page buttons with ellipsis logic
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Info */}
      <p className="text-xs text-gray-400 dark:text-gray-600">
        Hiển thị{' '}
        <span className="text-purple-600 dark:text-purple-400 font-semibold">{startItem}–{endItem}</span>
        {' '}trong tổng số{' '}
        <span className="text-purple-600 dark:text-purple-400 font-semibold">{totalItems}</span> {itemLabel}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2.5 rounded-xl border-2 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`ell-${idx}`} className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all border-2 ${
                p === currentPage
                  ? 'bg-gradient-to-br from-purple-600 to-violet-600 text-white border-transparent shadow-lg shadow-purple-200 dark:shadow-purple-900'
                  : 'border-purple-200 dark:border-purple-800 text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-400 dark:hover:border-purple-600'
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2.5 rounded-xl border-2 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
