import { ProductCarousel } from '@/components/cells';
import { HttpTypes } from '@medusajs/types';

export const GalleryCarousel = ({
  images,
}: {
  images: HttpTypes.StoreProduct['images'];
}) => {
  return (
    <div className='border w-full p-1 rounded-sm' data-testid="gallery-carousel">
      <ProductCarousel slides={images} />
    </div>
  );
};
