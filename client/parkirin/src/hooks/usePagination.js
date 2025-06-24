// src/hooks/usePagination.js
import { useState, useMemo } from 'react';

const usePagination = (data, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginationData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const items = data?.slice(startIndex, endIndex) || [];
    const totalPages = Math.ceil((data?.length || 0) / itemsPerPage);
    
    return {
      items,
      totalPages,
      totalItems: data?.length || 0,
      currentPage,
      itemsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, data?.length || 0)
    };
  }, [data, currentPage, itemsPerPage]);

  const goToPage = (page) => {
    const totalPages = Math.ceil((data?.length || 0) / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (paginationData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (paginationData.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    const totalPages = Math.ceil((data?.length || 0) / itemsPerPage);
    setCurrentPage(totalPages);
  };

  // Reset to first page when data changes
  const resetPagination = () => {
    setCurrentPage(1);
  };

  return {
    ...paginationData,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    resetPagination
  };
};

export default usePagination;
