import { ProductPostedDate } from '@/components/molecules/ProductPostedDate/ProductPostedDate';
import { ProductReportButton } from '@/components/molecules/ProductReportButton/ProductReportButton';
import { ProductTags } from '@/components/molecules/ProductTags/ProductTags';
import { HttpTypes } from '@medusajs/types';

export const ProductDetailsFooter = ({
  tags = [],
  posted,
}: {
  tags?: HttpTypes.StoreProductTag[];
  posted: HttpTypes.StoreProduct['created_at'];
}) => {
  return (
    <>
      <div className='p-4 border rounded-sm'>
        <ProductTags tags={tags} />
        <div className='flex justify-between items-center mt-4'>
          <ProductPostedDate posted={posted} />
          <ProductReportButton />
        </div>
      </div>
    </>
  );
};
