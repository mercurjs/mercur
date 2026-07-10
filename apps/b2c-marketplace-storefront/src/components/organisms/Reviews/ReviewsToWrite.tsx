'use client';

import { useState } from 'react';

import { HttpTypes } from '@medusajs/types';
import { isEmpty } from 'lodash';
import { usePathname } from 'next/navigation';

import { Card, NavigationItem } from '@/components/atoms';
import { Modal, ReviewForm } from '@/components/molecules';
import { Order } from '@/lib/data/reviews';

import { navigation } from './navigation';
import { OrderCard } from './OrderCard';

export const ReviewsToWrite = ({ orders }: { orders: Array<Order> }) => {
  const [showForm, setShowForm] = useState<
    | (HttpTypes.StoreOrder & {
        seller: { id: string; name: string; reviews?: any[] };
        reviews: any[];
      })
    | null
  >(null);
  const pathname = usePathname();

  return (
    <>
      <div className="space-y-8 md:col-span-3" data-testid="reviews-to-write-container">
        <h1 className="heading-md uppercase" data-testid="reviews-to-write-heading">Reviews</h1>
        <div className="flex gap-4">
          {navigation.map(item => (
            <NavigationItem
              key={item.label}
              href={item.href}
              data-testid={`reviews-to-write-navigation-item-${item.label}`}
              active={pathname === item.href}
              className="px-0"
            >
              {item.label}
            </NavigationItem>
          ))}
        </div>
        {isEmpty(orders) ? (
          <Card data-testid="reviews-to-write-empty-state">
            <div className="py-6 text-center">
              <h3 className="heading-lg uppercase text-primary" data-testid="reviews-to-write-empty-heading">No reviews to write</h3>
              <p className="mt-2 text-lg text-secondary" data-testid="reviews-to-write-empty-description">You currently have no one to review.</p>
            </div>
          </Card>
        ) : (
          orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              showForm={setShowForm}
              testIdPrefix={`order-card-${order.id}`}
            />
          ))
        )}
      </div>
      {showForm && (
        <Modal
          heading="Write review"
          onClose={() => setShowForm(null)}
        >
          <ReviewForm
            seller={showForm}
            handleClose={() => setShowForm(null)}
          />
        </Modal>
      )}
    </>
  );
};
