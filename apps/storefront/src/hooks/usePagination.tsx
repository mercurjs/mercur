import { useSearchParams } from 'next/navigation';
import useUpdateSearchParams from './useUpdateSearchParams';

export const usePagination = () => {
  const searchParams = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const currentPage = parseInt(
    searchParams.get('page') || '1'
  );

  const setPage = (page: string) => {
    updateSearchParams('page', page);
  };

  return { currentPage, setPage };
};
