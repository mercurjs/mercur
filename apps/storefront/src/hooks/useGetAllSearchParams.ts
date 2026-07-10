import { useSearchParams } from 'next/navigation';

function useGetAllSearchParams() {
  const searchParams = useSearchParams();

  // Get all search params without sortby and page
  const allSearchParams: { [anyProp: string]: string } = {};

  searchParams.forEach((value, key) => {
    if (key !== 'sortBy' && key !== 'page')
      allSearchParams[key] = value;
  });

  // Get all filter params count
  const count = Object.keys(allSearchParams)
    .map((key) => allSearchParams[key].split(',').length)
    .reduce((partialSum, a) => partialSum + a, 0);

  return { allSearchParams, count };
}

export default useGetAllSearchParams;
