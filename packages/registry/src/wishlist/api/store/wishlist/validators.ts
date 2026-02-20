import { z } from "zod";

import { createFindParams } from "@medusajs/medusa/api/utils/validators";

export type StoreGetWishlistsParamsType = z.infer<
  typeof StoreGetWishlistsParams
>;

export const StoreGetWishlistsParams = createFindParams({
  offset: 0,
  limit: 50,
});

export type StoreCreateWishlistType = z.infer<typeof StoreCreateWishlist>;

export const StoreCreateWishlist = z.object({
  reference: z.enum(["product"]),
  reference_id: z.string(),
});
