import { useSearchParams } from 'next/navigation';

function useGetAllSearchParams() {
  const searchParams = useSearchParams();

  const allSearchParams: { [anyProp: string]: string } = {};

  searchParams.forEach((value, key) => {
    if (key !== 'sortBy' && key !== 'page')
      allSearchParams[key] = value;
  });

  const count = Object.keys(allSearchParams)
    .map((key) => allSearchParams[key].split(',').length)
    .reduce((partialSum, a) => partialSum + a, 0);

  return { allSearchParams, count };
}

export default useGetAllSearchParams;
