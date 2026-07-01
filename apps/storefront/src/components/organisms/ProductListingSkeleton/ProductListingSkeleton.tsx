export const ProductListingSkeleton = () => {
  return (
    <div className='py-4' data-testid="product-listing-skeleton">
      <div className='lg:flex justify-between lg:h-10 items-center'>
        <div className='h-6 bg-secondary w-20 rounded-sm animate-pulse' />
        <div className='h-10 w-[200px] bg-secondary rounded-sm animate-pulse hidden lg:block' />
        <div className='flex lg:hidden gap-2 mt-4 mb-2'>
          <div className='w-1/2 h-[38px] bg-secondary rounded-sm animate-pulse' />
          <div className='w-1/2 h-[38px] bg-secondary rounded-sm animate-pulse' />
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-4 mt-6'>
        <div>
          <div className='rounded-sm bg-secondary h-80 border border-white animate-pulse' />
          <div className='rounded-sm bg-secondary h-80 border border-white animate-pulse' />
          <div className='rounded-sm bg-secondary h-80 border border-white animate-pulse' />
        </div>
        <div className='col-span-3'>
          <div className='grid sm:grid-cols-2 xl:grid-cols-3'>
            <div className='rounded-sm bg-secondary h-[600px] border border-white animate-pulse' />
            <div className='rounded-sm bg-secondary h-[600px] border border-white animate-pulse' />
            <div className='rounded-sm bg-secondary h-[600px] border border-white animate-pulse' />
            <div className='rounded-sm bg-secondary h-[600px] border border-white animate-pulse' />
            <div className='rounded-sm bg-secondary h-[600px] border border-white animate-pulse' />
            <div className='rounded-sm bg-secondary h-[600px] border border-white animate-pulse' />
            <div className='rounded-sm bg-secondary h-[600px] border border-white animate-pulse' />
            <div className='rounded-sm bg-secondary h-[600px] border border-white animate-pulse' />
            <div className='rounded-sm bg-secondary h-[600px] border border-white animate-pulse' />
          </div>
        </div>
      </div>
    </div>
  );
};
