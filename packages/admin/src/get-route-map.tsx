import type { HttpTypes } from "@medusajs/types";
import type { AdminReviewResponse } from "@mercurjs/types";

import { t } from "i18next";
import { Outlet, type RouteObject, type UIMatch } from "react-router-dom";

import { ProtectedRoute } from "@components/authentication/protected-route";
import { MainLayout } from "@components/layout/main-layout";
import { PublicLayout } from "@components/layout/public-layout";
import { SettingsLayout } from "@components/layout/settings-layout";
import { ErrorBoundary } from "@components/utilities/error-boundary";
import { RoutePermissionGuard } from "@mercurjs/dashboard-shared";
import {
  withLoaderPermission,
  withPermission,
} from "./lib/permissions/with-permission";

import { TaxRegionDetailBreadcrumb } from "./pages/tax-regions/tax-region-detail/breadcrumb";
import { taxRegionLoader } from "./pages/tax-regions/tax-region-detail/loader";

/**
 * Merges custom routes into base routes. Custom routes with a matching path
 * override the base route (preserving base children unless the custom route
 * provides its own). Non-matching custom routes are appended.
 */
function mergeRoutes(
  baseRoutes: RouteObject[],
  customRoutes: RouteObject[],
): RouteObject[] {
  const result = baseRoutes.map((route) => ({ ...route }));

  for (const customRoute of customRoutes) {
    const customPath = customRoute.path?.replace(/^\/+/, "");
    const existingIndex = result.findIndex(
      (r) => r.path != null && r.path.replace(/^\/+/, "") === customPath,
    );

    if (existingIndex !== -1) {
      const { children: customChildren, ...customRest } = customRoute;
      const baseHandle = result[existingIndex].handle as object | undefined;
      const customHandle = customRest.handle as object | undefined;
      result[existingIndex] = {
        ...result[existingIndex],
        ...customRest,
        path: result[existingIndex].path,
        // Merge rather than replace, so a custom route declaring only
        // `permissions` doesn't drop the base route's `breadcrumb`.
        handle:
          baseHandle || customHandle
            ? { ...baseHandle, ...customHandle }
            : undefined,
        children: customChildren
          ? mergeRoutes(result[existingIndex].children ?? [], customChildren)
          : result[existingIndex].children,
      } as RouteObject;
    } else {
      result.push(customRoute);
    }
  }

  return result;
}

export function getRouteMap({
  settingsRoutes: customSettingsRoutes,
  mainRoutes: customMainRoutes,
  publicRoutes: customPublicRoutes = [],
}: {
  settingsRoutes: RouteObject[];
  mainRoutes: RouteObject[];
  publicRoutes?: RouteObject[];
}) {
  return [
    {
      element: <ProtectedRoute />,
      errorElement: <ErrorBoundary />,
      children: [
        {
          element: <MainLayout />,
          children: [
            {
              // Pathless wrapper so every route below — including extension
              // routes merged in from virtual:mercur/routes — is enforced
              // without each one wiring its own guard element.
              element: <RoutePermissionGuard />,
              children: mergeRoutes(
            [
              {
                path: "/",
                errorElement: <ErrorBoundary />,
                lazy: () => import("./pages/home"),
              },
              {
                path: "/products",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("products.domain"),
                  permissions: "products:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/products/product-list"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "products:edit" },
                        lazy: () => import("./pages/products/product-create"),
                      },
                      {
                        path: "bulk-edit",
                        handle: { permissions: "products:edit" },
                        lazy: () =>
                          import("./pages/products/product-bulk-edit"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    errorElement: <ErrorBoundary />,
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/products/product-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "products:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminProductResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () => import("./pages/products/product-detail").then(withLoaderPermission("products:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "products:edit" },
                            lazy: () => import("./pages/products/product-edit"),
                          },
                          {
                            path: "edit-variant",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/product-variants/product-variant-edit").then(withLoaderPermission("products:edit")),
                          },
                          {
                            path: "sales-channels",
                            handle: { permissions: ["products:edit", "sales_channels:view"] },
                            lazy: () =>
                              import("./pages/products/product-sales-channels"),
                          },
                          {
                            path: "attributes",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/product-attributes"),
                          },
                          {
                            path: "attributes/create",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/product-create-attribute"),
                          },
                          {
                            path: "attributes/add",
                            handle: { permissions: ["products:edit", "product_attributes:view"] },
                            lazy: () =>
                              import("./pages/products/product-add-existing-attributes"),
                          },
                          {
                            path: "attributes/:attribute_id/edit",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/product-edit-attribute"),
                          },
                          {
                            path: "organization",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/product-organization"),
                          },
                          {
                            path: "shipping-profile",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/product-shipping-profile"),
                          },
                          {
                            path: "media",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/product-media"),
                          },
                          {
                            path: "variants/create",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/product-create-variant"),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/product-metadata"),
                          },
                        ],
                      },
                      {
                        path: "variants/:variant_id",
                        lazy: async () => {
                          const { Breadcrumb, loader } =
                            await import("./pages/product-variants/product-variant-detail");

                          return {
                            Component: Outlet,
                            loader: withPermission(loader, "products:view"),
                            handle: {
                              breadcrumb: (
                                // eslint-disable-next-line max-len
                                match: UIMatch<HttpTypes.AdminProductVariantResponse>,
                              ) => <Breadcrumb {...match} />,
                            },
                          };
                        },
                        children: [
                          {
                            path: "",
                            lazy: () =>
                              import("./pages/product-variants/product-variant-detail").then(withLoaderPermission("products:view")),
                            children: [
                              {
                                path: "edit",
                                handle: { permissions: "products:edit" },
                                lazy: () =>
                                  import("./pages/product-variants/product-variant-edit").then(withLoaderPermission("products:edit")),
                              },
                              {
                                path: "metadata/edit",
                                handle: { permissions: "products:edit" },
                                lazy: () =>
                                  import("./pages/product-variants/product-variant-metadata"),
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "/categories",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("categories.domain"),
                  permissions: "product_categories:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/categories/category-list"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "product_categories:edit" },
                        lazy: () =>
                          import("./pages/categories/category-create"),
                      },
                      {
                        path: "organize",
                        handle: { permissions: "product_categories:edit" },
                        lazy: () =>
                          import("./pages/categories/category-organize"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/categories/category-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "product_categories:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminProductCategoryResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/categories/category-detail").then(withLoaderPermission("product_categories:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "product_categories:edit" },
                            lazy: () =>
                              import("./pages/categories/category-edit"),
                          },
                          {
                            path: "media",
                            handle: { permissions: "product_categories:edit" },
                            lazy: () =>
                              import("./pages/categories/category-media"),
                          },
                          {
                            path: "icon/edit",
                            handle: { permissions: "product_categories:edit" },
                            lazy: () =>
                              import("./pages/categories/category-icon-edit"),
                          },
                          {
                            path: "products",
                            handle: { permissions: ["product_categories:edit", "products:view"] },
                            lazy: () =>
                              import("./pages/categories/category-products"),
                          },
                          {
                            path: "organize",
                            handle: { permissions: "product_categories:edit" },
                            lazy: () =>
                              import("./pages/categories/category-organize"),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "product_categories:edit" },
                            lazy: () =>
                              import("./pages/categories/categories-metadata"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "/orders",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("orders.domain"),
                  permissions: "orders:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/orders/order-list"),
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/orders/order-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "orders:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminOrderResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () => import("./pages/orders/order-detail").then(withLoaderPermission("orders:view")),
                        children: [
                          {
                            path: "returns",
                            handle: { permissions: "orders.returns:edit" },
                            lazy: () =>
                              import("./pages/orders/order-create-return"),
                          },
                          {
                            path: "claims",
                            handle: { permissions: "orders.returns:edit" },
                            lazy: () =>
                              import("./pages/orders/order-create-claim"),
                          },
                          {
                            path: "exchanges",
                            handle: { permissions: "orders.returns:edit" },
                            lazy: () =>
                              import("./pages/orders/order-create-exchange"),
                          },
                          {
                            path: "edits",
                            handle: { permissions: "orders.edits:edit" },
                            lazy: () =>
                              import("./pages/orders/order-create-edit"),
                          },
                          {
                            path: "refund",
                            handle: { permissions: "orders.refunds:edit" },
                            lazy: () =>
                              import("./pages/orders/order-create-refund"),
                          },
                          {
                            path: "transfer",
                            handle: { permissions: "orders:edit" },
                            lazy: () =>
                              import("./pages/orders/order-request-transfer"),
                          },
                          {
                            path: "email",
                            handle: { permissions: "orders:edit" },
                            lazy: () =>
                              import("./pages/orders/order-edit-email"),
                          },
                          {
                            path: "shipping-address",
                            handle: { permissions: "orders:edit" },
                            lazy: () =>
                              import("./pages/orders/order-edit-shipping-address"),
                          },
                          {
                            path: "billing-address",
                            handle: { permissions: "orders:edit" },
                            lazy: () =>
                              import("./pages/orders/order-edit-billing-address"),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "orders:edit" },
                            lazy: () => import("./pages/orders/order-metadata"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "/promotions",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("promotions.domain"),
                  permissions: "promotions:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/promotions/promotion-list"),
                  },
                  {
                    path: "create",
                    handle: { permissions: "promotions:edit" },
                    lazy: () => import("./pages/promotions/promotion-create"),
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/promotions/promotion-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "promotions:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminPromotionResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/promotions/promotion-detail").then(withLoaderPermission("promotions:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "promotions:edit" },
                            lazy: () =>
                              import("./pages/promotions/promotion-edit-details"),
                          },
                          {
                            path: "add-to-campaign",
                            handle: { permissions: ["promotions:edit", "campaigns:view"] },
                            lazy: () =>
                              import("./pages/promotions/promotion-add-campaign"),
                          },
                          {
                            path: ":ruleType/edit",
                            handle: { permissions: "promotions:edit" },
                            lazy: () =>
                              import("./pages/promotions/common/edit-rules"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "/campaigns",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("campaigns.domain"),
                  permissions: "campaigns:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/campaigns/campaign-list"),
                    children: [],
                  },
                  {
                    path: "create",
                    handle: { permissions: "campaigns:edit" },
                    lazy: () => import("./pages/campaigns/campaign-create"),
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/campaigns/campaign-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "campaigns:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminCampaignResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () => import("./pages/campaigns/campaign-detail").then(withLoaderPermission("campaigns:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "campaigns:edit" },
                            lazy: () =>
                              import("./pages/campaigns/campaign-edit"),
                          },
                          {
                            path: "configuration",
                            handle: { permissions: "campaigns:edit" },
                            lazy: () =>
                              import("./pages/campaigns/campaign-configuration"),
                          },
                          {
                            path: "edit-budget",
                            handle: { permissions: "campaigns:edit" },
                            lazy: () =>
                              import("./pages/campaigns/campaign-budget-edit"),
                          },
                          {
                            path: "add-promotions",
                            handle: { permissions: ["campaigns:edit", "promotions:view"] },
                            lazy: () =>
                              import("./pages/campaigns/add-campaign-promotions"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "/reviews",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("reviews.domain"),
                  permissions: "reviews:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/reviews/review-list"),
                    children: [],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } = await import(
                        "./pages/reviews/review-detail"
                      )

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "reviews:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<AdminReviewResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      }
                    },
                    children: [
                      {
                        path: "",
                        lazy: () => import("./pages/reviews/review-detail").then(withLoaderPermission("reviews:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "reviews:edit" },
                            lazy: () => import("./pages/reviews/review-edit"),
                          },
                          {
                            path: "respond",
                            handle: { permissions: "reviews:edit" },
                            lazy: () =>
                              import("./pages/reviews/review-respond"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "/collections",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("collections.domain"),
                  permissions: "product_collections:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/collections/collection-list"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "product_collections:edit" },
                        lazy: () =>
                          import("./pages/collections/collection-create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/collections/collection-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "product_collections:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminCollectionResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/collections/collection-detail").then(withLoaderPermission("product_collections:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "product_collections:edit" },
                            lazy: () =>
                              import("./pages/collections/collection-edit"),
                          },
                          {
                            path: "media",
                            handle: { permissions: "product_collections:edit" },
                            lazy: () =>
                              import("./pages/collections/collection-media"),
                          },
                          {
                            path: "icon/edit",
                            handle: { permissions: "product_collections:edit" },
                            lazy: () =>
                              import("./pages/collections/collection-icon-edit"),
                          },
                          {
                            path: "products",
                            handle: { permissions: ["product_collections:edit", "products:view"] },
                            lazy: () =>
                              import("./pages/collections/collection-add-products"),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "product_collections:edit" },
                            lazy: () =>
                              import("./pages/collections/collection-metadata"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "/price-lists",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("priceLists.domain"),
                  permissions: "price_lists:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/price-lists/price-list-list"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "price_lists:edit" },
                        lazy: () =>
                          import("./pages/price-lists/price-list-create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/price-lists/price-list-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "price_lists:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminPriceListResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/price-lists/price-list-detail").then(withLoaderPermission("price_lists:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "price_lists:edit" },
                            lazy: () =>
                              import("./pages/price-lists/price-list-edit"),
                          },
                          {
                            path: "configuration",
                            handle: { permissions: "price_lists:edit" },
                            lazy: () =>
                              import("./pages/price-lists/price-list-configuration"),
                          },
                          {
                            path: "customer-availability",
                            handle: { permissions: "price_lists:edit" },
                            lazy: () =>
                              import(
                                "./pages/price-lists/price-list-customer-availability"
                              ),
                          },
                          {
                            path: "products/add",
                            handle: { permissions: "price_lists:edit" },
                            lazy: () =>
                              import("./pages/price-lists/price-list-prices-add"),
                          },
                          {
                            path: "products/edit",
                            handle: { permissions: "price_lists:edit" },
                            lazy: () =>
                              import("./pages/price-lists/price-list-prices-edit"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "/customers",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("customers.domain"),
                  permissions: "customers:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/customers/customer-list"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "customers:edit" },
                        lazy: () => import("./pages/customers/customer-create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/customers/customer-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "customers:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminCustomerResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () => import("./pages/customers/customer-detail").then(withLoaderPermission("customers:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "customers:edit" },
                            lazy: () =>
                              import("./pages/customers/customer-edit"),
                          },
                          {
                            path: "create-address",
                            handle: { permissions: "customers:edit" },
                            lazy: () =>
                              import("./pages/customers/customer-create-address"),
                          },
                          {
                            path: "edit-address/:address_id",
                            handle: { permissions: "customers:edit" },
                            lazy: () =>
                              import("./pages/customers/customer-edit-address"),
                          },
                          {
                            path: "add-customer-groups",
                            handle: { permissions: ["customers:edit", "customer_groups:view"] },
                            lazy: () =>
                              import("./pages/customers/customers-add-customer-group"),
                          },
                          {
                            path: ":order_id/transfer",
                            handle: { permissions: "orders:edit" },
                            lazy: () =>
                              import("./pages/orders/order-request-transfer"),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "customers:edit" },
                            lazy: () =>
                              import("./pages/customers/customer-metadata"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "/customer-groups",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("customerGroups.domain"),
                  permissions: "customer_groups:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () =>
                      import("./pages/customer-groups/customer-group-list"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "customer_groups:edit" },
                        lazy: () =>
                          import("./pages/customer-groups/customer-group-create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/customer-groups/customer-group-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "customer_groups:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminCustomerGroupResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/customer-groups/customer-group-detail").then(withLoaderPermission("customer_groups:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "customer_groups:edit" },
                            lazy: () =>
                              import("./pages/customer-groups/customer-group-edit"),
                          },
                          {
                            path: "add-customers",
                            handle: { permissions: ["customer_groups:edit", "customers:view"] },
                            lazy: () =>
                              import("./pages/customer-groups/customer-group-add-customers"),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "customer_groups:edit" },
                            lazy: () =>
                              import("./pages/customer-groups/customer-group-metadata"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "/stores",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("stores.domain"),
                  permissions: "sellers:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/stores/store-list"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "sellers:edit" },
                        lazy: () => import("./pages/stores/store-create"),
                      },
                      {
                        path: "bulk-edit",
                        handle: { permissions: "sellers:edit" },
                        lazy: () => import("./pages/stores/store-bulk-edit"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb } =
                        await import("./pages/stores/store-details");

                      return {
                        Component: Outlet,
                        handle: {
                          breadcrumb: (match: UIMatch) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () => import("./pages/stores/store-details").then(withLoaderPermission("sellers:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "sellers:edit" },
                            lazy: () => import("./pages/stores/store-edit"),
                          },
                          {
                            path: "edit-address",
                            handle: { permissions: "sellers:edit" },
                            lazy: () =>
                              import("./pages/stores/store-address-edit"),
                          },
                          {
                            path: "professional-details",
                            handle: { permissions: "sellers:edit" },
                            lazy: () =>
                              import("./pages/stores/store-professional-details-edit"),
                          },
                          {
                            path: "payment-details",
                            handle: { permissions: "sellers:edit" },
                            lazy: () =>
                              import("./pages/stores/store-payment-details-edit"),
                          },
                          {
                            path: "store-closure",
                            handle: { permissions: "sellers:edit" },
                            lazy: () =>
                              import("./pages/stores/store-closure-edit"),
                          },
                          {
                            path: "invite",
                            handle: { permissions: "members.invites:edit" },
                            lazy: () =>
                              import("./pages/stores/store-member-invite"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "/payouts",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => "Payouts",
                  permissions: "payouts:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/payouts/payout-list"),
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/payouts/payout-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "payouts:view"),
                        handle: {
                          breadcrumb: (match: UIMatch) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () => import("./pages/payouts/payout-detail").then(withLoaderPermission("payouts:view")),
                      },
                    ],
                  },
                ],
              },
              {
                path: "/reservations",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("reservations.domain"),
                  permissions: "reservations:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/reservations/reservation-list"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "reservations:edit" },
                        lazy: () =>
                          import("./pages/reservations/reservation-create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/reservations/reservation-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "reservations:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminReservationResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/reservations/reservation-detail").then(withLoaderPermission("reservations:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "reservations:edit" },
                            lazy: () =>
                              import("./pages/reservations/reservation-detail/components/edit-reservation"),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "reservations:edit" },
                            lazy: () =>
                              import("./pages/reservations/reservation-metadata"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "/offers",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("offers.domain"),
                  permissions: ["offers:view", "products:view"],
                },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { OfferListPage } = await import(
                        "./pages/offers"
                      );
                      return { Component: OfferListPage };
                    },
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { loader } = await import(
                        "./pages/offers/[id]/loader"
                      );
                      const { Breadcrumb } = await import(
                        "./pages/offers/[id]/breadcrumb"
                      );
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, ["offers:view", "products:view"]),
                        handle: {
                          breadcrumb: (match: UIMatch) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { OfferDetailPage } = await import(
                            "./pages/offers/[id]/offer-detail-page"
                          );
                          return { Component: OfferDetailPage };
                        },
                      },
                      {
                        path: "variants/:offer_id",
                        lazy: async () => {
                          const { loader } = await import(
                            "./pages/offers/[id]/variants/[offer_id]/loader"
                          );
                          const { Breadcrumb } = await import(
                            "./pages/offers/[id]/variants/[offer_id]/breadcrumb"
                          );
                          return {
                            Component: Outlet,
                            loader: withPermission(loader, ["offers:view", "products:view"]),
                            handle: {
                              breadcrumb: (match: UIMatch) => (
                                <Breadcrumb {...match} />
                              ),
                            },
                          };
                        },
                        children: [
                          {
                            path: "",
                            lazy: async () => {
                              const { OfferVariantDetailPage } = await import(
                                "./pages/offers/[id]/variants/[offer_id]/offer-variant-detail-page"
                              );
                              return { Component: OfferVariantDetailPage };
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "/inventory",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("inventory.domain"),
                  permissions: "inventory_items:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/inventory/inventory-list"),
                    children: [
                      {
                        path: "stock",
                        handle: { permissions: ["inventory_items:edit", "stock_locations:view"] },
                        lazy: () => import("./pages/inventory/inventory-stock"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/inventory/inventory-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "inventory_items:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminInventoryItemResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/inventory/inventory-detail").then(withLoaderPermission("inventory_items:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "inventory_items:edit" },
                            lazy: () =>
                              import("./pages/inventory/inventory-detail/components/edit-inventory-item"),
                          },
                          {
                            path: "attributes",
                            handle: { permissions: "inventory_items:edit" },
                            lazy: () =>
                              import("./pages/inventory/inventory-detail/components/edit-inventory-item-attributes"),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "inventory_items:edit" },
                            lazy: () =>
                              import("./pages/inventory/inventory-metadata"),
                          },
                          {
                            path: "locations",
                            handle: { permissions: ["inventory_items:edit", "stock_locations:view"] },
                            lazy: () =>
                              import("./pages/inventory/inventory-detail/components/manage-locations"),
                          },
                          {
                            path: "locations/:location_id",
                            handle: { permissions: "inventory_items:edit" },
                            lazy: () =>
                              import("./pages/inventory/inventory-detail/components/adjust-inventory"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
            customMainRoutes,
              ),
            },
          ],
        },
      ],
    },
    {
      element: <ProtectedRoute />,
      errorElement: <ErrorBoundary />,
      children: [
        {
          path: "/settings",
          handle: {
            breadcrumb: () => t("app.nav.settings.header"),
          },
          element: <SettingsLayout />,
          children: [
            {
              element: <RoutePermissionGuard />,
              children: mergeRoutes(
            [
              {
                index: true,
                errorElement: <ErrorBoundary />,
                lazy: () => import("./pages/settings"),
              },
              {
                path: "profile",
                errorElement: <ErrorBoundary />,
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("profile.domain"),
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/profile/profile-detail"),
                    children: [
                      {
                        path: "edit",
                        lazy: () => import("./pages/profile/profile-edit"),
                      },
                    ],
                  },
                ],
              },
              {
                path: "regions",
                errorElement: <ErrorBoundary />,
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("regions.domain"),
                  permissions: "regions:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/regions/region-list"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "regions:edit" },
                        lazy: () => import("./pages/regions/region-create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/regions/region-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "regions:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminRegionResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () => import("./pages/regions/region-detail").then(withLoaderPermission("regions:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "regions:edit" },
                            lazy: () => import("./pages/regions/region-edit"),
                          },
                          {
                            path: "countries/add",
                            handle: { permissions: "regions:edit" },
                            lazy: () =>
                              import("./pages/regions/region-add-countries"),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "regions:edit" },
                            lazy: () =>
                              import("./pages/regions/region-metadata"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "marketplace",
                errorElement: <ErrorBoundary />,
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("marketplace.domain"),
                  permissions: "store:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () =>
                      import("./pages/marketplace/marketplace-detail").then(withLoaderPermission("store:view")),
                    children: [
                      {
                        path: "edit",
                        handle: { permissions: "store:edit" },
                        lazy: () =>
                          import("./pages/marketplace/marketplace-edit"),
                      },
                      {
                        path: "currencies",
                        handle: { permissions: ["store:edit", "regions:view", "price_preferences:view"] },
                        lazy: () =>
                          import("./pages/marketplace/marketplace-add-currencies"),
                      },
                      {
                        path: "metadata/edit",
                        handle: { permissions: "store:edit" },
                        lazy: () =>
                          import("./pages/marketplace/marketplace-metadata"),
                      },
                    ],
                  },
                ],
              },
              {
                path: "commissions",
                errorElement: <ErrorBoundary />,
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("commissions.domain"),
                  permissions: "commission_rates:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () =>
                      import("./pages/commissions/commissions-list"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "commission_rates:edit" },
                        lazy: () =>
                          import("./pages/commissions/commission-rule-create"),
                      },
                      {
                        path: "edit-global",
                        handle: { permissions: "commission_rates:edit" },
                        lazy: () =>
                          import("./pages/commissions/global-commission-edit"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb } = await import(
                        "./pages/commissions/commission-rule-detail"
                      );

                      return {
                        Component: Outlet,
                        handle: {
                          breadcrumb: (match: UIMatch) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/commissions/commission-rule-detail"),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "commission_rates:edit" },
                            lazy: () =>
                              import("./pages/commissions/commission-rule-edit"),
                          },
                          {
                            path: "edit-commission",
                            handle: { permissions: "commission_rates:edit" },
                            lazy: () =>
                              import(
                                "./pages/commissions/commission-rule-commission-edit"
                              ),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "users",
                errorElement: <ErrorBoundary />,
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("users.domain"),
                  permissions: "users:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/users/user-list"),
                    children: [
                      {
                        path: "invite",
                        handle: { permissions: "users:edit" },
                        lazy: () => import("./pages/users/user-invite"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/users/user-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "users:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminUserResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () => import("./pages/users/user-detail").then(withLoaderPermission("users:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "users:edit" },
                            lazy: () => import("./pages/users/user-edit"),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "users:edit" },
                            lazy: () => import("./pages/users/user-metadata"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "sales-channels",
                errorElement: <ErrorBoundary />,
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("salesChannels.domain"),
                  permissions: "sales_channels:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () =>
                      import("./pages/sales-channels/sales-channel-list"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "sales_channels:edit" },
                        lazy: () =>
                          import("./pages/sales-channels/sales-channel-create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/sales-channels/sales-channel-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "sales_channels:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminSalesChannelResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/sales-channels/sales-channel-detail").then(withLoaderPermission("sales_channels:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "sales_channels:edit" },
                            lazy: () =>
                              import("./pages/sales-channels/sales-channel-edit"),
                          },
                          {
                            path: "add-products",
                            handle: { permissions: ["sales_channels:edit", "products:view"] },
                            lazy: () =>
                              import("./pages/sales-channels/sales-channel-add-products"),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "sales_channels:edit" },
                            lazy: () =>
                              import("./pages/sales-channels/sales-channel-metadata"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "locations",
                errorElement: <ErrorBoundary />,
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("locations.domain"),
                  permissions: "stock_locations:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/locations/location-list"),
                  },
                  {
                    path: "create",
                    handle: { permissions: "stock_locations:edit" },
                    lazy: () => import("./pages/locations/location-create"),
                  },
                  {
                    path: "shipping-profiles",
                    element: <Outlet />,
                    handle: {
                      breadcrumb: () => t("shippingProfile.domain"),
                      permissions: "shipping_profiles:view",
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/shipping-profiles/shipping-profiles-list"),
                        children: [
                          {
                            path: "create",
                            handle: { permissions: "shipping_profiles:edit" },
                            lazy: () =>
                              import("./pages/shipping-profiles/shipping-profile-create"),
                          },
                        ],
                      },
                      {
                        path: ":shipping_profile_id",
                        lazy: async () => {
                          const { Breadcrumb, loader } =
                            await import("./pages/shipping-profiles/shipping-profile-detail");

                          return {
                            Component: Outlet,
                            loader: withPermission(loader, "shipping_profiles:view"),
                            handle: {
                              breadcrumb: (
                                // eslint-disable-next-line max-len
                                match: UIMatch<HttpTypes.AdminShippingProfileResponse>,
                              ) => <Breadcrumb {...match} />,
                            },
                          };
                        },
                        children: [
                          {
                            path: "",
                            lazy: () =>
                              import("./pages/shipping-profiles/shipping-profile-detail").then(withLoaderPermission("shipping_profiles:view")),
                            children: [
                              {
                                path: "metadata/edit",
                                handle: { permissions: "shipping_profiles:edit" },
                                lazy: () =>
                                  import("./pages/shipping-profiles/shipping-profile-metadata"),
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    path: "shipping-option-types",
                    errorElement: <ErrorBoundary />,
                    element: <Outlet />,
                    handle: {
                      breadcrumb: () => t("shippingOptionTypes.domain"),
                      permissions: "shipping_options:view",
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/shipping-option-types/shipping-option-type-list"),
                        children: [
                          {
                            path: "create",
                            handle: { permissions: "shipping_options:edit" },
                            lazy: () =>
                              import("./pages/shipping-option-types/shipping-option-type-create"),
                          },
                        ],
                      },
                      {
                        path: ":id",
                        lazy: async () => {
                          const { Breadcrumb, loader } =
                            await import("./pages/shipping-option-types/shipping-option-type-detail");

                          return {
                            Component: Outlet,
                            loader: withPermission(loader, "shipping_options:view"),
                            handle: {
                              breadcrumb: (
                                // eslint-disable-next-line max-len
                                match: UIMatch<HttpTypes.AdminShippingOptionTypeResponse>,
                              ) => <Breadcrumb {...match} />,
                            },
                          };
                        },
                        children: [
                          {
                            path: "",
                            lazy: () =>
                              import("./pages/shipping-option-types/shipping-option-type-detail").then(withLoaderPermission("shipping_options:view")),
                            children: [
                              {
                                path: "edit",
                                handle: { permissions: "shipping_options:edit" },
                                lazy: () =>
                                  import("./pages/shipping-option-types/shipping-option-type-edit"),
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    path: ":location_id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/locations/location-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "stock_locations:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminStockLocationResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () => import("./pages/locations/location-detail").then(withLoaderPermission("stock_locations:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "stock_locations:edit" },
                            lazy: () =>
                              import("./pages/locations/location-edit"),
                          },
                          {
                            path: "sales-channels",
                            handle: { permissions: ["stock_locations:edit", "sales_channels:view"] },
                            lazy: () =>
                              import("./pages/locations/location-sales-channels"),
                          },
                          {
                            path: "fulfillment-providers",
                            handle: { permissions: ["stock_locations:edit", "fulfillment_sets:view"] },
                            lazy: () =>
                              import("./pages/locations/location-fulfillment-providers"),
                          },
                          {
                            path: "fulfillment-set/:fset_id",
                            children: [
                              {
                                path: "service-zones/create",
                                handle: { permissions: "fulfillment_sets:edit" },
                                lazy: () =>
                                  import("./pages/locations/location-service-zone-create"),
                              },
                              {
                                path: "service-zone/:zone_id",
                                children: [
                                  {
                                    path: "edit",
                                    handle: { permissions: "fulfillment_sets:edit" },
                                    lazy: () =>
                                      import("./pages/locations/location-service-zone-edit"),
                                  },
                                  {
                                    path: "areas",
                                    handle: { permissions: "fulfillment_sets:edit" },
                                    lazy: () =>
                                      import("./pages/locations/location-service-zone-manage-areas"),
                                  },
                                  {
                                    path: "shipping-option",
                                    children: [
                                      {
                                        path: "create",
                                        handle: { permissions: "shipping_options:edit" },
                                        lazy: () =>
                                          import("./pages/locations/location-service-zone-shipping-option-create"),
                                      },
                                      {
                                        path: ":so_id",
                                        children: [
                                          {
                                            path: "edit",
                                            handle: { permissions: "shipping_options:edit" },
                                            lazy: () =>
                                              import("./pages/locations/location-service-zone-shipping-option-edit"),
                                          },
                                          {
                                            path: "pricing",
                                            handle: { permissions: "shipping_options:edit" },
                                            lazy: () =>
                                              import("./pages/locations/location-service-zone-shipping-option-pricing"),
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "product-tags",
                errorElement: <ErrorBoundary />,
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("productTags.domain"),
                  permissions: "product_tags:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/product-tags/product-tag-list").then(withLoaderPermission("product_tags:view")),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "product_tags:edit" },
                        lazy: () =>
                          import("./pages/product-tags/product-tag-create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/product-tags/product-tag-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "product_tags:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminProductTagResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/product-tags/product-tag-detail").then(withLoaderPermission("product_tags:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "product_tags:edit" },
                            lazy: () =>
                              import("./pages/product-tags/product-tag-edit"),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "product_tags:edit" },
                            lazy: () =>
                              import("./pages/product-tags/product-tag-metadata"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "attributes",
                errorElement: <ErrorBoundary />,
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("attributes.domain"),
                  permissions: "product_attributes:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/attributes/attribute-list").then(withLoaderPermission("product_attributes:view")),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "product_attributes:edit" },
                        lazy: () =>
                          import("./pages/attributes/attribute-create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/attributes/attribute-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "product_attributes:view"),
                        handle: {
                          breadcrumb: (match: UIMatch) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/attributes/attribute-detail").then(withLoaderPermission("product_attributes:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "product_attributes:edit" },
                            lazy: () =>
                              import("./pages/attributes/attribute-edit"),
                          },
                          {
                            path: "edit-possible-value",
                            handle: { permissions: "product_attributes:edit" },
                            lazy: () =>
                              import("./pages/attributes/attribute-edit-possible-value"),
                          },
                          {
                            path: "create-possible-value",
                            handle: { permissions: "product_attributes:edit" },
                            lazy: () =>
                              import("./pages/attributes/attribute-create-possible-value"),
                          },
                          {
                            path: "edit-ranking",
                            handle: { permissions: "product_attributes:edit" },
                            lazy: () =>
                              import("./pages/attributes/attribute-edit-ranking"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "product-types",
                errorElement: <ErrorBoundary />,
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("productTypes.domain"),
                  permissions: "product_types:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () =>
                      import("./pages/product-types/product-type-list"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "product_types:edit" },
                        lazy: () =>
                          import("./pages/product-types/product-type-create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/product-types/product-type-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "product_types:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminProductTypeResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/product-types/product-type-detail").then(withLoaderPermission("product_types:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "product_types:edit" },
                            lazy: () =>
                              import("./pages/product-types/product-type-edit"),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "product_types:edit" },
                            lazy: () =>
                              import("./pages/product-types/product-type-metadata"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "publishable-api-keys",
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("apiKeyManagement.domain.publishable"),
                  permissions: "api_keys:view",
                },
                children: [
                  {
                    path: "",
                    element: <Outlet />,
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/api-key-management/api-key-management-list"),
                        children: [
                          {
                            path: "create",
                            handle: { permissions: "api_keys:edit" },
                            lazy: () =>
                              import("./pages/api-key-management/api-key-management-create"),
                          },
                        ],
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/api-key-management/api-key-management-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "api_keys:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminApiKeyResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/api-key-management/api-key-management-detail").then(withLoaderPermission("api_keys:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "api_keys:edit" },
                            lazy: () =>
                              import("./pages/api-key-management/api-key-management-edit"),
                          },
                          {
                            path: "sales-channels",
                            handle: { permissions: ["api_keys:edit", "sales_channels:view"] },
                            lazy: () =>
                              import("./pages/api-key-management/api-key-management-sales-channels"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "secret-api-keys",
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("apiKeyManagement.domain.secret"),
                  permissions: "api_keys:view",
                },
                children: [
                  {
                    path: "",
                    element: <Outlet />,
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/api-key-management/api-key-management-list"),
                        children: [
                          {
                            path: "create",
                            handle: { permissions: "api_keys:edit" },
                            lazy: () =>
                              import("./pages/api-key-management/api-key-management-create"),
                          },
                        ],
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb, loader } =
                        await import("./pages/api-key-management/api-key-management-detail");

                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "api_keys:view"),
                        handle: {
                          breadcrumb: (
                            match: UIMatch<HttpTypes.AdminApiKeyResponse>,
                          ) => <Breadcrumb {...match} />,
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () =>
                          import("./pages/api-key-management/api-key-management-detail").then(withLoaderPermission("api_keys:view")),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "api_keys:edit" },
                            lazy: () =>
                              import("./pages/api-key-management/api-key-management-edit"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "tax-regions",
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("taxRegions.domain"),
                  permissions: "tax_regions:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/tax-regions/tax-region-list"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "tax_regions:edit" },
                        lazy: () =>
                          import("./pages/tax-regions/tax-region-create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    Component: Outlet,
                    loader: withPermission(taxRegionLoader, "tax_regions:view"),
                    handle: {
                      breadcrumb: (
                        match: UIMatch<HttpTypes.AdminTaxRegionResponse>,
                      ) => <TaxRegionDetailBreadcrumb {...match} />,
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { Component } =
                            await import("./pages/tax-regions/tax-region-detail");

                          return {
                            Component,
                          };
                        },
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "tax_regions:edit" },
                            lazy: () =>
                              import("./pages/tax-regions/tax-region-edit"),
                          },
                          {
                            path: "provinces/create",
                            handle: { permissions: "tax_regions:edit" },
                            lazy: () =>
                              import("./pages/tax-regions/tax-region-province-create"),
                          },
                          {
                            path: "overrides/create",
                            handle: { permissions: "tax_regions:edit" },
                            lazy: () =>
                              import("./pages/tax-regions/tax-region-tax-override-create"),
                          },
                          {
                            path: "overrides/:tax_rate_id/edit",
                            handle: { permissions: "tax_regions:edit" },
                            lazy: () =>
                              import("./pages/tax-regions/tax-region-tax-override-edit"),
                          },
                          {
                            path: "tax-rates/create",
                            handle: { permissions: "tax_regions:edit" },
                            lazy: () =>
                              import("./pages/tax-regions/tax-region-tax-rate-create"),
                          },
                          {
                            path: "tax-rates/:tax_rate_id/edit",
                            handle: { permissions: "tax_regions:edit" },
                            lazy: () =>
                              import("./pages/tax-regions/tax-region-tax-rate-edit"),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "tax_regions:edit" },
                            lazy: () =>
                              import("./pages/tax-regions/tax-region-metadata"),
                          },
                        ],
                      },
                      {
                        path: "provinces/:province_id",
                        lazy: async () => {
                          const { Breadcrumb, loader } =
                            await import("./pages/tax-regions/tax-region-province-detail");

                          return {
                            Component: Outlet,
                            loader: withPermission(loader, "tax_regions:view"),
                            handle: {
                              breadcrumb: (
                                match: UIMatch<HttpTypes.AdminTaxRegionResponse>,
                              ) => <Breadcrumb {...match} />,
                            },
                          };
                        },
                        children: [
                          {
                            path: "",
                            lazy: () =>
                              import("./pages/tax-regions/tax-region-province-detail").then(withLoaderPermission("tax_regions:view")),
                            children: [
                              {
                                path: "tax-rates/create",
                                handle: { permissions: "tax_regions:edit" },
                                lazy: () =>
                                  import("./pages/tax-regions/tax-region-tax-rate-create"),
                              },
                              {
                                path: "tax-rates/:tax_rate_id/edit",
                                handle: { permissions: "tax_regions:edit" },
                                lazy: () =>
                                  import("./pages/tax-regions/tax-region-tax-rate-edit"),
                              },
                              {
                                path: "overrides/create",
                                handle: { permissions: "tax_regions:edit" },
                                lazy: () =>
                                  import("./pages/tax-regions/tax-region-tax-override-create"),
                              },
                              {
                                path: "overrides/:tax_rate_id/edit",
                                handle: { permissions: "tax_regions:edit" },
                                lazy: () =>
                                  import("./pages/tax-regions/tax-region-tax-override-edit"),
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "return-reasons",
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("returnReasons.domain"),
                  permissions: "return_reasons:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () =>
                      import("./pages/return-reasons/return-reason-list").then(withLoaderPermission("return_reasons:view")),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "return_reasons:edit" },
                        lazy: () =>
                          import("./pages/return-reasons/return-reason-create"),
                      },

                      {
                        path: ":id",
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "return_reasons:edit" },
                            lazy: () =>
                              import("./pages/return-reasons/return-reason-edit"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: "refund-reasons",
                element: <Outlet />,
                handle: {
                  breadcrumb: () => t("refundReasons.domain"),
                  permissions: "refund_reasons:view",
                },
                children: [
                  {
                    path: "",
                    lazy: () =>
                      import("./pages/refund-reasons/refund-reason-list").then(withLoaderPermission("refund_reasons:view")),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "refund_reasons:edit" },
                        lazy: () =>
                          import("./pages/refund-reasons/refund-reason-create"),
                      },

                      {
                        path: ":id",
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "refund_reasons:edit" },
                            lazy: () =>
                              import("./pages/refund-reasons/refund-reason-edit"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
            customSettingsRoutes?.[0]?.children || [],
              ),
            },
          ],
        },
      ],
    },
    {
      element: <PublicLayout />,
      children: [
        {
          errorElement: <ErrorBoundary />,
          children: [
            {
              path: "/login",
              lazy: () => import("./pages/login"),
            },
            {
              path: "/reset-password",
              lazy: () => import("./pages/reset-password"),
            },
            {
              path: "/invite",
              lazy: () => import("./pages/invite"),
            },
            ...customPublicRoutes,
            {
              path: "*",
              lazy: () => import("./pages/no-match"),
            },
          ],
        },
      ],
    },
  ];
}
