import { isEmpty } from 'lodash';

import { LoginForm, ParcelAccordion, UserNavigation } from '@/components/molecules';
import { OrdersPagination } from '@/components/sections';
import { retrieveCustomer } from '@/lib/data/customer';
import { listOrders } from '@/lib/data/orders';

const LIMIT = 10;

export default async function UserPage({
  searchParams
}: {
  searchParams: Promise<{ page: string }>;
}) {
  const user = await retrieveCustomer();

  if (!user) return <LoginForm />;

  const orders = await listOrders();

  const { page } = await searchParams;

  const pages = Math.ceil(orders.length / LIMIT);
  const currentPage = +page || 1;
  const offset = (+currentPage - 1) * LIMIT;

  const orderGroupsGrouped = orders.reduce(
    (acc, order) => {
      const orderGroupId = (order as any).order_group.id;
      if (!acc[orderGroupId]) {
        acc[orderGroupId] = [];
      }
      acc[orderGroupId].push(order);
      return acc;
    },
    {} as Record<string, typeof orders>
  );

  const orderGroups = Object.entries(orderGroupsGrouped).map(([orderGroupId, orders]) => {
    const firstOrder = orders[0];
    const orderGroup = (firstOrder as any).order_group;

    return {
      id: orderGroupId,
      orders: orders,
      created_at: orderGroup.created_at,
      display_id: orderGroup.display_id,
      total: orders.reduce((sum, order) => sum + order.total, 0),
      currency_code: firstOrder.currency_code
    };
  });

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
          {isEmpty(orders) ? (
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
                    currency_code={orderGroup.currency_code}
                  />
                ))}
              </div>
              <OrdersPagination pages={pages} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
