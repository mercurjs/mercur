import { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export interface StoreData {
  store_name: string;
  storefront_url: string;
}

export async function fetchStoreData(
  container: MedusaContainer
): Promise<StoreData> {
  const storeModuleService = container.resolve(Modules.STORE);

  const stores = await storeModuleService.listStores();
  const store = stores[0];

  const storeName = store?.name || "Mercur";
  const storefrontUrl =
    process.env.STOREFRONT_URL || "https://mercurjs.com";

  return {
    store_name: storeName,
    storefront_url: storefrontUrl,
  };
}

