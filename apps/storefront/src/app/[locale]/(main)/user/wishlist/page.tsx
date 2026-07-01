import { HttpTypes } from '@medusajs/types';
import { isEmpty } from 'lodash';
import { redirect } from 'next/navigation';

import { Button } from '@/components/atoms';
import { WishlistItem } from '@/components/cells';
import { UserNavigation } from '@/components/molecules';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { retrieveCustomer } from '@/lib/data/customer';
import { getUserWishlists } from '@/lib/data/wishlist';
import { Wishlist as WishlistType } from '@/types/wishlist';

export default async function Wishlist({ params }: { params: Promise<{ locale: string }> }) {
  const user = await retrieveCustomer();
  const { locale } = await params;

  let wishlist: WishlistType = { products: [] };
  if (user) {
    wishlist = await getUserWishlists({ countryCode: locale });
  }

  const count = wishlist?.products?.length || 0;

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="container" data-testid="wishlist-page">
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-8">
        <UserNavigation />
        <div className="space-y-8 md:col-span-3" data-testid="wishlist-container">
          {isEmpty(wishlist?.products) ? (
            <div className="mx-auto flex w-96 flex-col items-center justify-center" data-testid="wishlist-empty-state">
              <h2 className="heading-lg mb-2 uppercase text-primary" data-testid="wishlist-empty-heading">Wishlist</h2>
              <p className="mb-6 text-lg text-secondary" data-testid="wishlist-empty-description">Your wishlist is currently empty.</p>
              <LocalizedClientLink
                href="/categories"
                className="w-full"
              >
                <Button className="w-full" data-testid="wishlist-explore-button">Explore</Button>
              </LocalizedClientLink>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <h2 className="heading-lg uppercase text-primary" data-testid="wishlist-heading">Wishlist</h2>
              <div className="flex items-center justify-between">
                <p data-testid="wishlist-count">{count} listings</p>
              </div>
              <div className="flex flex-wrap gap-4 max-md:justify-center" data-testid="wishlist-products-list">
                {wishlist?.products?.map(product => (
                  <WishlistItem
                    key={product.id}
                    product={
                      product as HttpTypes.StoreProduct & {
                        calculated_amount: number;
                        currency_code: string;
                      }
                    }
                    wishlist={wishlist}
                    user={user}
                    testIdPrefix={`wishlist-item-${product.id}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
