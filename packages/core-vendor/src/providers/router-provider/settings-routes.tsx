/**
 * SETTINGS ROUTES - Agent B
 *
 * All settings routes for the vendor panel.
 * Using folder-based routing structure.
 */

import { Outlet, RouteObject, UIMatch } from "react-router-dom"
import { t } from "i18next"
import { ErrorBoundary } from "@components/utilities/error-boundary"

export const settingsRoutes: RouteObject[] = [
  // INDEX - redirect to seller
  {
    index: true,
    errorElement: <ErrorBoundary />,
    lazy: () => import("@pages/settings"),
  },

  // SELLER (new - replaces store)
  {
    path: "seller",
    errorElement: <ErrorBoundary />,
    handle: { breadcrumb: () => t("seller.domain", "Seller") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/settings/seller"),
        children: [
          {
            path: "edit",
            lazy: () => import("@pages/settings/seller/edit"),
          },
        ],
      },
    ],
  },

  // PROFILE
  {
    path: "profile",
    errorElement: <ErrorBoundary />,
    handle: { breadcrumb: () => t("profile.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/settings/profile"),
        children: [
          {
            path: "edit",
            lazy: () => import("@pages/settings/profile/edit"),
          },
        ],
      },
    ],
  },

  // REGIONS
  {
    path: "regions",
    errorElement: <ErrorBoundary />,
    element: <Outlet />,
    handle: { breadcrumb: () => t("regions.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/settings/regions"),
        children: [
          {
            path: "create",
            lazy: () => import("@pages/settings/regions/create"),
          },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Component, Breadcrumb, loader } = await import(
            "@pages/settings/regions/[id]"
          )
          return {
            Component,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "edit",
            lazy: () => import("@pages/settings/regions/[id]/edit"),
          },
          {
            path: "countries/add",
            lazy: () => import("@pages/settings/regions/[id]/countries/add"),
          },
          {
            path: "metadata/edit",
            lazy: () => import("@pages/settings/regions/[id]/metadata"),
          },
        ],
      },
    ],
  },

  // USERS
  {
    path: "users",
    errorElement: <ErrorBoundary />,
    element: <Outlet />,
    handle: { breadcrumb: () => t("users.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/settings/users"),
        children: [
          {
            path: "invite",
            lazy: () => import("@pages/settings/users/invite"),
          },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Component, Breadcrumb, loader } = await import(
            "@pages/settings/users/[id]"
          )
          return {
            Component,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "edit",
            lazy: () => import("@pages/settings/users/[id]/edit"),
          },
          {
            path: "metadata/edit",
            lazy: () => import("@pages/settings/users/[id]/metadata"),
          },
        ],
      },
    ],
  },

  // LOCATIONS
  {
    path: "locations",
    errorElement: <ErrorBoundary />,
    element: <Outlet />,
    handle: { breadcrumb: () => t("locations.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/settings/locations"),
        children: [
          {
            path: "create",
            lazy: () => import("@pages/settings/locations/create"),
          },
        ],
      },
      {
        path: "shipping-profiles",
        element: <Outlet />,
        handle: { breadcrumb: () => t("shippingProfile.domain") },
        children: [
          {
            path: "",
            lazy: () => import("@pages/settings/shipping-profiles"),
            children: [
              {
                path: "create",
                lazy: () => import("@pages/settings/shipping-profiles/create"),
              },
            ],
          },
          {
            path: ":shipping_profile_id",
            lazy: async () => {
              const { Component, Breadcrumb, loader } = await import(
                "@pages/settings/shipping-profiles/[id]"
              )
              return {
                Component,
                loader,
                handle: {
                  breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
                },
              }
            },
            children: [
              {
                path: "metadata/edit",
                lazy: () =>
                  import("@pages/settings/shipping-profiles/[id]/metadata"),
              },
            ],
          },
        ],
      },
      {
        path: ":location_id",
        lazy: async () => {
          const { Component, Breadcrumb, loader } = await import(
            "@pages/settings/locations/[location_id]"
          )
          return {
            Component,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "edit",
            lazy: () => import("@pages/settings/locations/[location_id]/edit"),
          },
          {
            path: "sales-channels",
            lazy: () =>
              import("@pages/settings/locations/[location_id]/sales-channels"),
          },
          {
            path: "fulfillment-providers",
            lazy: () =>
              import(
                "@pages/settings/locations/[location_id]/fulfillment-providers"
              ),
          },
          {
            path: "fulfillment-set/:fset_id/service-zones/create",
            lazy: () =>
              import(
                "@pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zones/create"
              ),
          },
          {
            path: "fulfillment-set/:fset_id/service-zone/:zone_id/edit",
            lazy: () =>
              import(
                "@pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/edit"
              ),
          },
          {
            path: "fulfillment-set/:fset_id/service-zone/:zone_id/areas",
            lazy: () =>
              import(
                "@pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/areas"
              ),
          },
          {
            path: "fulfillment-set/:fset_id/service-zone/:zone_id/shipping-option/create",
            lazy: () =>
              import(
                "@pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/shipping-option/create"
              ),
          },
          {
            path: "fulfillment-set/:fset_id/service-zone/:zone_id/shipping-option/:so_id/edit",
            lazy: () =>
              import(
                "@pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/shipping-option/[so_id]/edit"
              ),
          },
          {
            path: "fulfillment-set/:fset_id/service-zone/:zone_id/shipping-option/:so_id/pricing",
            lazy: () =>
              import(
                "@pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/shipping-option/[so_id]/pricing"
              ),
          },
        ],
      },
    ],
  },

  // TAX REGIONS
  {
    path: "tax-regions",
    errorElement: <ErrorBoundary />,
    element: <Outlet />,
    handle: { breadcrumb: () => t("taxRegions.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/settings/tax-regions"),
        children: [
          {
            path: "create",
            lazy: () => import("@pages/settings/tax-regions/create"),
          },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Component, Breadcrumb, loader } = await import(
            "@pages/settings/tax-regions/[id]"
          )
          return {
            Component,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "tax-rates/create",
            lazy: () =>
              import("@pages/settings/tax-regions/[id]/tax-rates/create"),
          },
          {
            path: "tax-rates/:tax_rate_id/edit",
            lazy: () =>
              import(
                "@pages/settings/tax-regions/[id]/tax-rates/[tax_rate_id]/edit"
              ),
          },
          {
            path: "tax-overrides/create",
            lazy: () =>
              import("@pages/settings/tax-regions/[id]/tax-overrides/create"),
          },
          {
            path: "tax-overrides/:tax_rate_id/edit",
            lazy: () =>
              import(
                "@pages/settings/tax-regions/[id]/tax-overrides/[tax_rate_id]/edit"
              ),
          },
          {
            path: "provinces/create",
            lazy: () =>
              import("@pages/settings/tax-regions/[id]/provinces/create"),
          },
          {
            path: "provinces/:province_id",
            lazy: async () => {
              const { Component, Breadcrumb, loader } = await import(
                "@pages/settings/tax-regions/[id]/provinces/[province_id]"
              )
              return {
                Component,
                loader,
                handle: {
                  breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
                },
              }
            },
            children: [
              {
                path: "tax-rates/create",
                lazy: () =>
                  import("@pages/settings/tax-regions/[id]/tax-rates/create"),
              },
              {
                path: "tax-rates/:tax_rate_id/edit",
                lazy: () =>
                  import(
                    "@pages/settings/tax-regions/[id]/tax-rates/[tax_rate_id]/edit"
                  ),
              },
              {
                path: "tax-overrides/create",
                lazy: () =>
                  import(
                    "@pages/settings/tax-regions/[id]/tax-overrides/create"
                  ),
              },
              {
                path: "tax-overrides/:tax_rate_id/edit",
                lazy: () =>
                  import(
                    "@pages/settings/tax-regions/[id]/tax-overrides/[tax_rate_id]/edit"
                  ),
              },
            ],
          },
        ],
      },
    ],
  },

  // PRODUCT TAGS
  {
    path: "product-tags",
    errorElement: <ErrorBoundary />,
    element: <Outlet />,
    handle: { breadcrumb: () => t("productTags.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/settings/product-tags"),
        children: [
          {
            path: "create",
            lazy: () => import("@pages/settings/product-tags/create"),
          },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Component, Breadcrumb, loader } = await import(
            "@pages/settings/product-tags/[id]"
          )
          return {
            Component,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "edit",
            lazy: () => import("@pages/settings/product-tags/[id]/edit"),
          },
        ],
      },
    ],
  },

  // PRODUCT TYPES
  {
    path: "product-types",
    errorElement: <ErrorBoundary />,
    element: <Outlet />,
    handle: { breadcrumb: () => t("productTypes.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/settings/product-types"),
        children: [
          {
            path: "create",
            lazy: () => import("@pages/settings/product-types/create"),
          },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Component, Breadcrumb, loader } = await import(
            "@pages/settings/product-types/[id]"
          )
          return {
            Component,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "edit",
            lazy: () => import("@pages/settings/product-types/[id]/edit"),
          },
        ],
      },
    ],
  },

  // RETURN REASONS
  {
    path: "return-reasons",
    errorElement: <ErrorBoundary />,
    element: <Outlet />,
    handle: { breadcrumb: () => t("returnReasons.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/settings/return-reasons"),
        children: [
          {
            path: "create",
            lazy: () => import("@pages/settings/return-reasons/create"),
          },
          {
            path: ":id/edit",
            lazy: () => import("@pages/settings/return-reasons/[id]/edit"),
          },
        ],
      },
    ],
  },
]
