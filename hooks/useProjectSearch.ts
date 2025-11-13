'use client';
import { useState, useCallback, useMemo } from 'react';
import { useGetAllProjectsQuery } from '../store/api_query/LazyKill/project.api';

interface UseProjectSearchProps {
  defaultPage?: number;
  defaultPageSize?: number;
  defaultSort?: string;
  defaultSortDirection?: 'asc' | 'desc';
}

type QueryParams = {
  page: number;
  countPerPage: number;
  sort: string;
  sortDirection: 'asc' | 'desc';
} & Record<string, string | number>; // allow extra string or number values

interface SearchFilters {
  [key: string]: string;
}

export const useProjectSearch = ({
  defaultPage = 1,
  defaultPageSize = 10,
  defaultSort = 'createdAt',
  defaultSortDirection = 'desc'
}: UseProjectSearchProps = {}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['name', 'status']);
  const [page, setPage] = useState(defaultPage);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sort, setSort] = useState(defaultSort);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);

  // Build query parameters for the API
  const queryParams = useMemo(() => {
    const params: QueryParams = {
      page,
      countPerPage: pageSize,
      sort,
      sortDirection
    };

    // Add search filters for selected columns
    // Only add search terms if there's actually a search term
    if (searchTerm && searchTerm.trim() && selectedColumns.length > 0) {
      selectedColumns.forEach(column => {
        params[column] = searchTerm.trim();
      });
    }

    // Clean up undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    return params;
  }, [searchTerm, selectedColumns, page, pageSize, sort, sortDirection]);

  // Use the API query - only pass parameters if we have search or pagination/sorting
  const shouldUseParams = searchTerm.trim() || page !== 1 || pageSize !== 10 || sort !== 'createdAt' || sortDirection !== 'desc';
  const apiParams = shouldUseParams ? queryParams : undefined;

  const {
    data: projectsData,
    isLoading,
    isError,
    error,
    refetch
  } = useGetAllProjectsQuery(apiParams);

  // Debug logging
  console.log('useProjectSearch Debug:', {
    apiParams,
    shouldUseParams,
    projectsData,
    isLoading,
    isError,
    error,
    searchTerm,
    selectedColumns
  });

  // Handle search
  const handleSearch = useCallback((term: string, columns: string[]) => {
    setSearchTerm(term);
    setSelectedColumns(columns);
    setPage(1); // Reset to first page when searching
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  // Handle sorting
  const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort(field);
    setSortDirection(direction);
    setPage(1); // Reset to first page when sorting
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setPage(1);
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedColumns(['name', 'status']);
    setPage(defaultPage);
    setPageSize(defaultPageSize);
    setSort(defaultSort);
    setSortDirection(defaultSortDirection);
  }, [defaultPage, defaultPageSize, defaultSort, defaultSortDirection]);

  return {
    // Data
    projects: projectsData?.data?.projects || [],
    totalCount: projectsData?.data?.total || 0,

    // Loading states
    isLoading,
    isError,
    error,

    // Search state
    searchTerm,
    selectedColumns,

    // Pagination state
    page,
    pageSize,
    totalPages: Math.ceil((projectsData?.data?.total || 0) / pageSize),

    // Sort state
    sort,
    sortDirection,

    // Actions
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    clearSearch,
    resetFilters,
    refetch,

    // Current query params (useful for debugging)
    queryParams
  };
};

export default useProjectSearch;