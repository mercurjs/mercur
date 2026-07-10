import { UserNavigation } from '@/components/molecules/UserNavigation/UserNavigation';
import { OrderReturnRequests } from '@/components/sections/OrderReturnRequests/OrderReturnRequests';
import { retrieveCustomer } from '@/lib/data/customer';
import { getReturns, retrieveReturnReasons } from '@/lib/data/orders';

export default async function ReturnsPage({
  searchParams
}: {
  searchParams: Promise<{ page: string; return: string }>;
}) {
  const { order_return_requests } = await getReturns();
  const returnReasons = await retrieveReturnReasons();

  const user = await retrieveCustomer();

  const { page, return: returnId } = await searchParams;

  return (
    <main className="container">
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3">
          <h1 className="heading-md uppercase" data-testid="returns-heading">Returns</h1>
          <OrderReturnRequests
            returns={order_return_requests.sort(
              (a, b) =>
                new Date(b.line_items[0].created_at).getTime() -
                new Date(a.line_items[0].created_at).getTime()
            )}
            user={user}
            page={page}
            currentReturn={returnId || ''}
            returnReasons={returnReasons}
          />
        </div>
      </div>
    </main>
  );
}
