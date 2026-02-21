import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";

import { filterNullSellerProducts } from "../utils/filter-null-products";

export const filterNullProductsMiddleware = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    if (body && body.products) {
      body.products = filterNullSellerProducts(body.products);
    }
    return originalJson(body);
  };

  next();
};
