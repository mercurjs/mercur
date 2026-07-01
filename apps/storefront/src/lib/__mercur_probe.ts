import { mercur } from './mercur';

async function probe() {
  // store.products.query should be typed from core routes
  const products = await mercur.store.products.query({
    limit: 12,
    fields: '*variants',
    fetchOptions: { headers: { authorization: 'Bearer x' } },
  });
  // single seller by id
  const seller = await mercur.store.sellers.$id.query({ $id: 'sel_1' });
  // order groups list (mercur-specific)
  const groups = await mercur.store.orderGroups.query({});
  return { products, seller, groups };
}
void probe;
