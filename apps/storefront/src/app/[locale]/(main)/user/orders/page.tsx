import { isEmpty } from 'lodash';

import { LoginForm, ParcelAccordion, UserNavigation } from '@/components/molecules';
import { OrdersPagination } from '@/components/sections';
import { retrieveCustomer } from '@/lib/data/customer';
import { listOrderGroups } from '@/lib/data/orders';

const LIMIT = 10;

export default async function UserPage({
  searchParams
}: {
  searchParams: Promise<{ page: string }>;
}) {
  const user = await retrieveCustomer();

  if (!user) return <LoginForm />;

  const orderGroups = await listOrderGroups();

  const { page } = await searchParams;

  const pages = Math.ceil(orderGroups.length / LIMIT);
  const currentPage = +page || 1;
  const offset = (+currentPage - 1) * LIMIT;

  const processedOrders = orderGroups.slice(offset, offset + LIMIT);

  return (
    <main
      className="container"
      data-testid="orders-page"
    >
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-8">
        <UserNavigation />
        <div
          className="space-y-8 md:col-span-3"
          data-testid="orders-container"
        >
          <h1 className="heading-md uppercase">Orders</h1>
          {isEmpty(orderGroups) ? (
            <div
              className="text-center"
              data-testid="orders-empty-state"
            >
              <h3
                className="heading-lg uppercase text-primary"
                data-testid="no-orders-heading"
              >
                No orders
              </h3>
              <p
                className="mt-2 text-lg text-secondary"
                data-testid="no-orders-description"
              >
                You haven&apos;t placed any order yet. Once you place an order, it will appear here.
              </p>
            </div>
          ) : (
            <>
              <div
                className="w-full max-w-full"
                data-testid="orders-list"
              >
                {processedOrders.map(orderGroup => (
                  <ParcelAccordion
                    key={orderGroup.id}
                    orderId={orderGroup.id}
                    orderDisplayId={`#${orderGroup.display_id}`}
                    createdAt={orderGroup.created_at}
                    total={orderGroup.total}
                    orders={orderGroup.orders || []}
                    currency_code={orderGroup.orders?.[0]?.currency_code}
                  />
                ))}
              </div>
              {/* TODO - pagination */}
              <OrdersPagination pages={pages} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
