import { GalleryCarousel } from '@/components/organisms';
import { HttpTypes } from '@medusajs/types';

export const ProductGallery = ({
  images,
}: {
  images: HttpTypes.StoreProduct['images'];
}) => {
  if (!images || images.length === 0) return null;
   
  return (
    <div data-testid="product-gallery">
      <GalleryCarousel images={images} />
    </div>
  );
};
