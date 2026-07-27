import {
  useRouter,
  useSearchParams,
} from 'next/navigation';
import useUpdateSearchParams from './useUpdateSearchParams';

const useFilters = (key: string) => {
  const updateSearchParams = useUpdateSearchParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const params = searchParams.get(key) || '';
  const filters = Array.from(
    new Set(params.split(',').filter(Boolean))
  );

  const updateFilters = (value: string) => {
    const elementExists = Boolean(
      filters.find((el) => el === value)
    );

    if (elementExists) {
      updateSearchParams(
        key,
        `${filters.filter((el) => el !== value).join(',')}`
      );
    } else {
      updateSearchParams(
        key,
        `${filters.join(',')}${
          filters.length ? ',' : ''
        }${value}`
      );
    }
  };

  const isFilterActive = (value: string) => {
    const params = searchParams.get(key) || '';
    const filters = Array.from(
      new Set(params.split(',').filter(Boolean))
    );

    return Boolean(filters.find((el) => el === value));
  };

  const clearAllFilters = () => {
    router.push(window.location.pathname, {
      scroll: false,
    });
  };

  return {
    updateFilters,
    filters,
    isFilterActive,
    clearAllFilters,
  };
};

export default useFilters;
