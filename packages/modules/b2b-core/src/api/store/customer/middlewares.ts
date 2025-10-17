import { MiddlewareRoute } from "@medusajs/framework/http";
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { authenticate } from "@medusajs/medusa";

export const storeCustomerRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: "ALL",
    matcher: "/store/customers/me*",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["DELETE"],

    matcher: "/store/customers/me",
  },
];
