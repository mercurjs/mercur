import { CartWorkflowDTO } from "@medusajs/framework/types"
import { isDefined, isPresent } from "@medusajs/framework/utils"
import {
  createHook,
  createWorkflow,
  parallelize,
  transform,
  when,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  listShippingOptionsForCartWithPricingWorkflow,
  refreshCartShippingMethodsWorkflowId,
  releaseLockStep,
  removeShippingMethodFromCartStep,
  updateShippingMethodsStep,
  useQueryGraphStep,
  validateCartStep,
} from "@medusajs/medusa/core-flows"
import { AdditionalData } from "@medusajs/types"
import { WorkflowManager } from "@medusajs/framework/orchestration"

import type { MercurPatch } from "../types"

const APPLIED = Symbol.for("mercur.patch.refresh-cart-shipping-methods")

type RefreshInput = {
  cart_id?: string
  cart?: RefreshCart
}

type RefreshCartItem = {
  requires_shipping?: boolean
  offer?: { shipping_profile_id?: string | null } | null
  variant?: { product?: { shipping_profile?: { id?: string } | null } | null } | null
}

type RefreshShippingMethod = {
  id: string
  shipping_option_id: string
  data?: Record<string, unknown>
}

type RefreshCart = {
  id: string
  items?: RefreshCartItem[]
  shipping_methods?: RefreshShippingMethod[]
}

type PricedShippingOption = {
  id: string
  name: string
  shipping_profile_id?: string | null
  calculated_price?: {
    calculated_amount?: number
    is_calculated_price_tax_inclusive?: boolean
  }
}

const CART_FIELDS = [
  "id",
  "sales_channel_id",
  "currency_code",
  "region_id",
  "shipping_methods.*",
  "shipping_address.city",
  "shipping_address.country_code",
  "shipping_address.province",
  "shipping_methods.shipping_option_id",
  "shipping_methods.data",
  "total",
  "items.requires_shipping",
  "items.variant.product.shipping_profile.id",
  "items.offer.shipping_profile_id",
]

function defineWorkflow(): void {
  createWorkflow(
    { name: refreshCartShippingMethodsWorkflowId, idempotent: false },
    (input: WorkflowData<RefreshInput & AdditionalData>) => {
      const shouldExecute = transform({ input }, ({ input }) => {
        if (input.cart) {
          return !!input.cart.shipping_methods?.length
        }
        return !!input.cart_id
      })

      const cartId = transform({ input }, ({ input }) => {
        return input.cart_id ?? input.cart?.id
      })

      const fetchCart = when("fetch-cart", { shouldExecute }, ({ shouldExecute }) => {
        return shouldExecute
      }).then(() => {
        const { data: cart } = useQueryGraphStep({
          entity: "cart",
          fields: CART_FIELDS,
          filters: { id: cartId },
          options: { throwIfKeyNotFound: true, isList: false },
        }).config({ name: "get-cart" })

        return cart
      })

      const cart = transform({ fetchCart, input }, ({ fetchCart, input }) => {
        return (fetchCart ?? input.cart) as RefreshCart
      })

      validateCartStep({
        cart: cart as unknown as WorkflowData<CartWorkflowDTO>,
      })

      acquireLockStep({ key: cart.id, timeout: 2, ttl: 10 })

      const listShippingOptionsInput = transform({ cart }, ({ cart }) =>
        (cart.shipping_methods || [])
          .map((shippingMethod) => ({
            id: shippingMethod.shipping_option_id,
            data: shippingMethod.data,
          }))
          .filter(Boolean)
      )

      const validate = createHook("validate", { input, cart })

      when(
        "should-prepare-shipping-methods",
        { listShippingOptionsInput },
        ({ listShippingOptionsInput }) => {
          return !!listShippingOptionsInput?.length
        }
      ).then(() => {
        const shippingOptions =
          listShippingOptionsForCartWithPricingWorkflow.runAsStep({
            input: {
              options: listShippingOptionsInput,
              cart_id: cart.id,
              is_return: false,
              additional_data: input.additional_data,
            },
          })

        const shippingMethodsData = transform(
          { cart, shippingOptions },
          ({ cart, shippingOptions }) => {
            const { shipping_methods: shippingMethods = [], items = [] } = cart
            const options = shippingOptions as unknown as PricedShippingOption[]

            const shouldCleanupOrphanProfiles = shippingMethods.length > 1

            // Upstream derives this from the product's shipping profile alone.
            // In Mercur the offer owns the profile a seller ships from — the
            // product link is one-to-one and the first offerer wins it — so a
            // co-sold product's other sellers would have their methods deleted
            // as orphans in a multi-seller cart. Product profile stays as the
            // fallback for lines that were not bought through an offer.
            const requiredProfileIds = new Set(
              items
                .filter((item) => item.requires_shipping)
                .map(
                  (item) =>
                    item.offer?.shipping_profile_id ??
                    item.variant?.product?.shipping_profile?.id
                )
                .filter(Boolean)
            )

            const validShippingMethods = shippingMethods.filter(
              (shippingMethod) => {
                const shippingOption = options.find(
                  (option) => option.id === shippingMethod.shipping_option_id
                )

                const shippingOptionPrice =
                  shippingOption?.calculated_price?.calculated_amount

                if (!isPresent(shippingOption) || !isDefined(shippingOptionPrice)) {
                  return false
                }

                const profileId = shippingOption?.shipping_profile_id
                if (
                  shouldCleanupOrphanProfiles &&
                  profileId &&
                  !requiredProfileIds.has(profileId)
                ) {
                  return false
                }

                return true
              }
            )

            const validShippingMethodIds = new Set(
              validShippingMethods.map((sm) => sm.id)
            )
            const invalidShippingMethodIds = shippingMethods
              .map((sm) => sm.id)
              .filter((id) => !validShippingMethodIds.has(id))

            const shippingMethodsToUpdate = validShippingMethods.map(
              (shippingMethod) => {
                const shippingOption = options.find(
                  (option) => option.id === shippingMethod.shipping_option_id
                )!

                return {
                  id: shippingMethod.id,
                  shipping_option_id: shippingOption.id,
                  name: shippingOption.name,
                  amount: shippingOption.calculated_price!.calculated_amount,
                  is_tax_inclusive:
                    shippingOption.calculated_price!
                      .is_calculated_price_tax_inclusive,
                }
              }
            )

            return {
              shippingMethodsToRemove: invalidShippingMethodIds,
              shippingMethodsToUpdate,
            }
          }
        )

        parallelize(
          removeShippingMethodFromCartStep({
            shipping_method_ids: shippingMethodsData.shippingMethodsToRemove,
          }),
          updateShippingMethodsStep(shippingMethodsData.shippingMethodsToUpdate)
        )

        releaseLockStep({ key: cart.id })
      })

      return new WorkflowResponse(void 0, { hooks: [validate] })
    }
  )
}

export const refreshCartShippingMethodsPatch: MercurPatch = {
  id: "core-flows/refresh-cart-shipping-methods",
  package: "@medusajs/core-flows",
  compatible: { from: "2.17.0", to: "2.19.0" },
  scope: "registry",
  reason:
    "The orphan-profile cleanup deletes a seller's shipping method whenever the " +
    "line's master product is profile-linked to a different seller, which breaks " +
    "checkout for every multi-seller cart containing a co-sold product.",

  detect() {
    // Core must have registered first: we replace its definition, we do not
    // race it. The registry is process-global, so one check covers every copy.
    return !!WorkflowManager.getWorkflow(refreshCartShippingMethodsWorkflowId)
  },

  isApplied() {
    return (globalThis as Record<symbol, unknown>)[APPLIED] === true
  },

  apply() {
    // `register` throws when a name is redefined with a different body, and
    // `createWorkflow` routes to it for an existing name.
    WorkflowManager.unregister(refreshCartShippingMethodsWorkflowId)
    defineWorkflow()
    ;(globalThis as Record<symbol, unknown>)[APPLIED] = true
  },
}
