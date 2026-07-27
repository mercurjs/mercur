'use client';
import { Pagination } from '@/components/cells';
import { usePagination } from '@/hooks/usePagination';

export const ProductsPagination = ({
  pages,
}: {
  pages: number;
}) => {
  const { currentPage, setPage } = usePagination();

  const setPageHandler = (page: number) => {
    setPage(`${page}`);
  };
  return (
    <div className='mt-6 flex justify-center'>
      <Pagination
        pages={pages}
        setPage={setPageHandler}
        currentPage={currentPage}
      />
    </div>
  );
};
