import { WishlistTabs } from '@/components/organisms';
import { HomeCategories } from '../HomeCategories/HomeCategories';

export const WishlistPage = ({ tab }: { tab: string }) => {
  return (
    <>
      <WishlistTabs tab={tab} />
      <HomeCategories heading='Explore' />
    </>
  );
};
