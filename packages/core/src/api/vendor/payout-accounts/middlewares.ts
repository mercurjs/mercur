import { applySellerLinkFilter, requirePermission } from "../../utils"
import {
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import {
  vendorMyPayoutAccountQueryConfig,
  vendorPayoutAccountQueryConfig,
  vendorOnboardingQueryConfig,
} from "./query-config"
import {
  VendorCreateOnboarding,
  VendorCreatePayoutAccount,
  VendorGetPayoutAccountParams,
  VendorGetPayoutAccountsParams,
} from "./validators"

const applySellerPayoutAccountLinkFilter = applySellerLinkFilter()

export const vendorPayoutAccountsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/payout-accounts/me",
    middlewares: [
      requirePermission("payout_accounts", "view"),
      validateAndTransformQuery(
        VendorGetPayoutAccountParams,
        vendorMyPayoutAccountQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/payout-accounts",
    middlewares: [
      requirePermission("payout_accounts", "view"),
      validateAndTransformQuery(
        VendorGetPayoutAccountsParams,
        vendorPayoutAccountQueryConfig.list
      ),
      applySellerPayoutAccountLinkFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/payout-accounts",
    middlewares: [
      requirePermission("payout_accounts", "edit"),
      validateAndTransformBody(VendorCreatePayoutAccount),
      validateAndTransformQuery(
        VendorGetPayoutAccountParams,
        vendorPayoutAccountQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/payout-accounts/:id",
    middlewares: [
      requirePermission("payout_accounts", "view"),
      validateAndTransformQuery(
        VendorGetPayoutAccountParams,
        vendorPayoutAccountQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/payout-accounts/:id/onboarding",
    middlewares: [
      requirePermission("payout_accounts", "edit"),
      validateAndTransformBody(VendorCreateOnboarding),
      validateAndTransformQuery(
        VendorGetPayoutAccountParams,
        vendorOnboardingQueryConfig.retrieve
      ),
    ],
  },
]
