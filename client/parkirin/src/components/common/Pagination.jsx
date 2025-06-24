// src/components/common/Pagination.jsx
import React from 'react';
import { classNames } from '../../utils/helpers';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showPrevNext = true,
  showFirstLast = true,
  maxVisiblePages = 5,
  className = ''
}) => {
  const getVisiblePages = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    const adjustedStartPage = Math.max(1, endPage - maxVisiblePages + 1);

    for (let i = adjustedStartPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const PageButton = ({ page, isActive, disabled, children, onClick }) => (
    <button
      onClick={() => onClick && onClick(page)}
      disabled={disabled}
      className={classNames(
        'relative inline-flex items-center px-4 py-2 text-sm font-medium border transition-all duration-200 hover:scale-105',
        {
          'z-10 bg-primary-50 border-primary-500 text-primary-600 shadow-md': isActive,
          'bg-white border-gray-300 text-gray-500 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600': !isActive && !disabled,
          'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed': disabled
        }
      )}
    >
      {children}
    </button>
  );

  if (totalPages <= 1) return null;

  return (
    <nav className={classNames('flex items-center justify-between', className)}>
      <div className="flex-1 flex justify-between sm:hidden">
        <PageButton
          page={currentPage - 1}
          disabled={currentPage === 1}
          onClick={onPageChange}
        >
          Previous
        </PageButton>
        <PageButton
          page={currentPage + 1}
          disabled={currentPage === totalPages}
          onClick={onPageChange}
        >
          Next
        </PageButton>
      </div>
      
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing page{' '}
            <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {showFirstLast && currentPage > 1 && (
              <PageButton
                page={1}
                onClick={onPageChange}
                className="rounded-l-md"
              >
                First
              </PageButton>
            )}
            
            {showPrevNext && (
              <PageButton
                page={currentPage - 1}
                disabled={currentPage === 1}
                onClick={onPageChange}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </PageButton>
            )}

            {visiblePages[0] > 1 && (
              <>
                <PageButton page={1} onClick={onPageChange}>
                  1
                </PageButton>
                {visiblePages[0] > 2 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                )}
              </>
            )}

            {visiblePages.map(page => (
              <PageButton
                key={page}
                page={page}
                isActive={page === currentPage}
                onClick={onPageChange}
              >
                {page}
              </PageButton>
            ))}

            {visiblePages[visiblePages.length - 1] < totalPages && (
              <>
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                )}
                <PageButton page={totalPages} onClick={onPageChange}>
                  {totalPages}
                </PageButton>
              </>
            )}

            {showPrevNext && (
              <PageButton
                page={currentPage + 1}
                disabled={currentPage === totalPages}
                onClick={onPageChange}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </PageButton>
            )}
            
            {showFirstLast && currentPage < totalPages && (
              <PageButton
                page={totalPages}
                onClick={onPageChange}
                className="rounded-r-md"
              >
                Last
              </PageButton>
            )}
          </nav>
        </div>
      </div>
    </nav>
  );
};

export default Pagination;
