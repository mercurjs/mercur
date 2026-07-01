import { Label } from '@/components/atoms';
import { HttpTypes } from '@mercurjs/types';

export const ProductTags = ({
  tags,
}: {
  tags: HttpTypes.StoreProductTag[];
}) => {
  return (
    <div className='flex gap-2'>
      {tags.map(({ id, value }) => (
        <Label key={id}>{value}</Label>
      ))}
    </div>
  );
};
