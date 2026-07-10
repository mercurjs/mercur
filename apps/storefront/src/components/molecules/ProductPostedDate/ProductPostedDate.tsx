import { formatDistanceToNow } from 'date-fns';

export const ProductPostedDate = async ({
  posted,
}: {
  posted: string | null;
}) => {
  const postedDate = formatDistanceToNow(
    new Date(posted || ''),
    { addSuffix: true }
  );

  return (
    <p className='label-md text-secondary'>
      Posted: {postedDate}
    </p>
  );
};
