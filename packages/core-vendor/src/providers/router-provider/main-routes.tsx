/**
 * MAIN ROUTES - Agent A
 *
 * Folder-based routing structure matching core-admin pattern.
 */

import { Outlet, RouteObject, UIMatch } from "react-router-dom"
import { t } from "i18next"
import { ErrorBoundary } from "@components/utilities/error-boundary"

export const mainRoutes: RouteObject[] = [
  // HOME
  {
    path: "/",
    errorElement: <ErrorBoundary />,
    lazy: () => import("@pages/home"),
  },

  // PRODUCTS
  {
    path: "/products",
    errorElement: <ErrorBoundary />,
    handle: { breadcrumb: () => t("products.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/products"),
        children: [
          { path: "create", lazy: () => import("@pages/products/create") },
          { path: "import", lazy: () => import("@pages/products/import") },
          { path: "export", lazy: () => import("@pages/products/export") },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Breadcrumb, loader } = await import("@pages/products/[id]")
          return {
            Component: Outlet,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "",
            lazy: () => import("@pages/products/[id]"),
            children: [
              { path: "edit", lazy: () => import("@pages/products/[id]/edit") },
              { path: "sales-channels", lazy: () => import("@pages/products/[id]/sales-channels") },
              { path: "organization", lazy: () => import("@pages/products/[id]/organization") },
              { path: "media", lazy: () => import("@pages/products/[id]/media") },
              { path: "attributes", lazy: () => import("@pages/products/[id]/attributes") },
              { path: "additional-attributes", lazy: () => import("@pages/products/[id]/additional-attributes") },
              { path: "metadata", lazy: () => import("@pages/products/[id]/metadata") },
              { path: "shipping-profile", lazy: () => import("@pages/products/[id]/shipping-profile") },
              { path: "prices", lazy: () => import("@pages/products/[id]/prices") },
              { path: "options/create", lazy: () => import("@pages/products/[id]/options/create") },
              { path: "variants/create", lazy: () => import("@pages/products/[id]/variants/create") },
            ],
          },
          { path: "stock", lazy: () => import("@pages/products/[id]/stock") },
        ],
      },
    ],
  },

  // ORDERS
  {
    path: "/orders",
    errorElement: <ErrorBoundary />,
    handle: { breadcrumb: () => t("orders.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/orders"),
      },
      {
        path: ":id",
        lazy: async () => {
          const { Breadcrumb, loader } = await import("@pages/orders/[id]")
          return {
            Component: Outlet,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "",
            lazy: () => import("@pages/orders/[id]"),
            children: [
              { path: "fulfillment", lazy: () => import("@pages/orders/[id]/fulfillment") },
              { path: "allocate-items", lazy: () => import("@pages/orders/[id]/allocate-items") },
            ],
          },
          { path: "fulfillments/:f_id/shipment", lazy: () => import("@pages/orders/[id]/shipment") },
        ],
      },
    ],
  },

  // CATEGORIES
  {
    path: "/categories",
    errorElement: <ErrorBoundary />,
    handle: { breadcrumb: () => t("categories.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/categories"),
        children: [
          { path: "create", lazy: () => import("@pages/categories/create") },
          { path: "organize", lazy: () => import("@pages/categories/organize") },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Breadcrumb, loader } = await import("@pages/categories/[id]")
          return {
            Component: Outlet,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "",
            lazy: () => import("@pages/categories/[id]"),
            children: [
              { path: "edit", lazy: () => import("@pages/categories/[id]/edit") },
              { path: "products", lazy: () => import("@pages/categories/[id]/products") },
              { path: "organize", lazy: () => import("@pages/categories/[id]/organize") },
              { path: "metadata", lazy: () => import("@pages/categories/[id]/metadata") },
            ],
          },
        ],
      },
    ],
  },

  // COLLECTIONS
  {
    path: "/collections",
    errorElement: <ErrorBoundary />,
    handle: { breadcrumb: () => t("collections.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/collections"),
        children: [
          { path: "create", lazy: () => import("@pages/collections/create") },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Breadcrumb, loader } = await import("@pages/collections/[id]")
          return {
            Component: Outlet,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "",
            lazy: () => import("@pages/collections/[id]"),
            children: [
              { path: "edit", lazy: () => import("@pages/collections/[id]/edit") },
              { path: "add-products", lazy: () => import("@pages/collections/[id]/add-products") },
              { path: "metadata", lazy: () => import("@pages/collections/[id]/metadata") },
            ],
          },
        ],
      },
    ],
  },

  // CUSTOMERS
  {
    path: "/customers",
    errorElement: <ErrorBoundary />,
    handle: { breadcrumb: () => t("customers.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/customers"),
        children: [
          { path: "create", lazy: () => import("@pages/customers/create") },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Breadcrumb, loader } = await import("@pages/customers/[id]")
          return {
            Component: Outlet,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "",
            lazy: () => import("@pages/customers/[id]"),
            children: [
              { path: "edit", lazy: () => import("@pages/customers/[id]/edit") },
              { path: "add-customer-groups", lazy: () => import("@pages/customers/[id]/add-customer-groups") },
              { path: "metadata", lazy: () => import("@pages/customers/[id]/metadata") },
            ],
          },
        ],
      },
    ],
  },

  // CUSTOMER GROUPS
  {
    path: "/customer-groups",
    errorElement: <ErrorBoundary />,
    handle: { breadcrumb: () => t("customerGroups.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/customer-groups"),
        children: [
          { path: "create", lazy: () => import("@pages/customer-groups/create") },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Breadcrumb, loader } = await import("@pages/customer-groups/[id]")
          return {
            Component: Outlet,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "",
            lazy: () => import("@pages/customer-groups/[id]"),
            children: [
              { path: "edit", lazy: () => import("@pages/customer-groups/[id]/edit") },
              { path: "add-customers", lazy: () => import("@pages/customer-groups/[id]/add-customers") },
              { path: "metadata", lazy: () => import("@pages/customer-groups/[id]/metadata") },
            ],
          },
        ],
      },
    ],
  },

  // INVENTORY
  {
    path: "/inventory",
    errorElement: <ErrorBoundary />,
    handle: { breadcrumb: () => t("inventory.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/inventory"),
        children: [
          { path: "create", lazy: () => import("@pages/inventory/create") },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Breadcrumb, loader } = await import("@pages/inventory/[id]")
          return {
            Component: Outlet,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "",
            lazy: () => import("@pages/inventory/[id]"),
            children: [
              { path: "edit", lazy: () => import("@pages/inventory/[id]/_components/edit-inventory-item") },
              { path: "attributes", lazy: () => import("@pages/inventory/[id]/_components/edit-inventory-item-attributes") },
              { path: "stock", lazy: () => import("@pages/inventory/[id]/stock") },
              { path: "metadata", lazy: () => import("@pages/inventory/[id]/metadata") },
              { path: "locations", lazy: () => import("@pages/inventory/[id]/_components/manage-locations") },
              { path: "locations/:location_id", lazy: () => import("@pages/inventory/[id]/_components/adjust-inventory") },
            ],
          },
        ],
      },
    ],
  },

  // PROMOTIONS
  {
    path: "/promotions",
    errorElement: <ErrorBoundary />,
    handle: { breadcrumb: () => t("promotions.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/promotions"),
        children: [
          { path: "create", lazy: () => import("@pages/promotions/create") },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Breadcrumb, loader } = await import("@pages/promotions/[id]")
          return {
            Component: Outlet,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "",
            lazy: () => import("@pages/promotions/[id]"),
            children: [
              { path: "edit", lazy: () => import("@pages/promotions/[id]/edit") },
              { path: "add-to-campaign", lazy: () => import("@pages/promotions/[id]/add-to-campaign") },
            ],
          },
        ],
      },
    ],
  },

  // CAMPAIGNS
  {
    path: "/campaigns",
    errorElement: <ErrorBoundary />,
    handle: { breadcrumb: () => t("campaigns.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/campaigns"),
        children: [
          { path: "create", lazy: () => import("@pages/campaigns/create") },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Breadcrumb, loader } = await import("@pages/campaigns/[id]")
          return {
            Component: Outlet,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "",
            lazy: () => import("@pages/campaigns/[id]"),
            children: [
              { path: "edit", lazy: () => import("@pages/campaigns/[id]/edit") },
              { path: "configuration", lazy: () => import("@pages/campaigns/[id]/configuration") },
              { path: "edit-budget", lazy: () => import("@pages/campaigns/[id]/edit-budget") },
              { path: "add-promotions", lazy: () => import("@pages/campaigns/[id]/add-promotions") },
            ],
          },
        ],
      },
    ],
  },

  // PRICE LISTS
  {
    path: "/price-lists",
    errorElement: <ErrorBoundary />,
    handle: { breadcrumb: () => t("priceLists.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/price-lists"),
        children: [
          { path: "create", lazy: () => import("@pages/price-lists/create") },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Breadcrumb, loader } = await import("@pages/price-lists/[id]")
          return {
            Component: Outlet,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "",
            lazy: () => import("@pages/price-lists/[id]"),
            children: [
              { path: "edit", lazy: () => import("@pages/price-lists/[id]/edit") },
              { path: "configuration", lazy: () => import("@pages/price-lists/[id]/configuration") },
              { path: "products/add", lazy: () => import("@pages/price-lists/[id]/products/add") },
              { path: "products/edit", lazy: () => import("@pages/price-lists/[id]/products/edit") },
              { path: "products/:variant_id/edit", lazy: () => import("@pages/price-lists/[id]/products/[variant_id]/edit") },
            ],
          },
        ],
      },
    ],
  },

  // RESERVATIONS
  {
    path: "/reservations",
    errorElement: <ErrorBoundary />,
    handle: { breadcrumb: () => t("reservations.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/reservations"),
        children: [
          { path: "create", lazy: () => import("@pages/reservations/create") },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Breadcrumb, loader } = await import("@pages/reservations/[id]")
          return {
            Component: Outlet,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          {
            path: "",
            lazy: () => import("@pages/reservations/[id]"),
            children: [
              { path: "metadata", lazy: () => import("@pages/reservations/[id]/metadata") },
            ],
          },
        ],
      },
    ],
  },

  // PRODUCT VARIANTS (standalone routes)
  {
    path: "/products/:product_id/variants/:variant_id",
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { loader } = await import("@pages/product-variants/product-variant-detail")
      return {
        Component: Outlet,
        loader,
      }
    },
    children: [
      {
        path: "",
        lazy: () => import("@pages/product-variants/product-variant-detail"),
        children: [
          {
            path: "edit",
            lazy: async () => {
              const { ProductVariantEdit } = await import(
                "@pages/product-variants/product-variant-edit/product-variant-edit"
              )
              return { Component: ProductVariantEdit }
            },
          },
          { path: "prices", lazy: () => import("@pages/products/[id]/prices") },
        ],
      },
    ],
  },
]
