import { MiddlewareRoute } from "@medusajs/framework/http";
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { authenticate } from "@medusajs/medusa";
import { StoreChangePassword } from "./validators";

export const storeCustomCustomerRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: "ALL",
    matcher: "/store/customer/me*",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["DELETE"],
    matcher: "/store/customer/me",
  },
  {
    method: ["POST"],
    matcher: "/store/customer/me/change-password",
    middlewares: [validateAndTransformBody(StoreChangePassword)],
  },
];
