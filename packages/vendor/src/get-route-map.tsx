import { t } from "i18next";
import { Outlet, RouteObject, UIMatch } from "react-router-dom";
import { ProtectedRoute } from "./components/authentication/protected-route";
import { MainLayout } from "./components/layout/main-layout";
import { PublicLayout } from "./components/layout/public-layout";
import { SettingsLayout } from "./components/layout/settings-layout";
import { RoutePermissionGuard } from "@mercurjs/dashboard-shared";
import {
  withLoaderPermission,
  withPermission,
} from "./lib/permissions/with-permission";
import { ErrorBoundary } from "./components/utilities/error-boundary";

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
      result[existingIndex] = {
        ...result[existingIndex],
        ...customRest,
        path: result[existingIndex].path,
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
    // PROTECTED - MAIN LAYOUT
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
                handle: { breadcrumb: () => t("products.domain"), permissions: "products:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { productListLoader, ProductListPage } =
                        await import("./pages/products");
                      return {
                        Component: ProductListPage,
                        loader: withPermission(productListLoader, "products:view"),
                      };
                    },
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "products:edit" },
                        lazy: async () => {
                          const { ProductCreatePage } =
                            await import("./pages/products/create");
                          return {
                            Component: ProductCreatePage,
                          };
                        },
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { loader } = await import("./pages/products/[id]");
                      const { Breadcrumb } =
                        await import("./pages/products/[id]/breadcrumb");
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "products:view"),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { ProductDetailPage } =
                            await import("./pages/products/[id]");
                          return {
                            Component: ProductDetailPage,
                          };
                        },
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "products:edit" },
                            lazy: () => import("./pages/products/[id]/edit"),
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
                              import("./pages/products/[id]/sales-channels"),
                          },
                          {
                            path: "organization",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/[id]/organization"),
                          },
                          {
                            path: "media",
                            handle: { permissions: "products:edit" },
                            lazy: () => import("./pages/products/[id]/media"),
                          },
                          {
                            path: "attributes",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/[id]/attributes"),
                          },
                          {
                            path: "attributes/create",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/[id]/attributes/create"),
                          },
                          {
                            path: "attributes/add",
                            handle: { permissions: ["products:edit", "product_attributes:view"] },
                            lazy: () =>
                              import("./pages/products/[id]/attributes/add"),
                          },
                          {
                            path: "attributes/:attribute_id/edit",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/[id]/attributes/[attribute_id]/edit"),
                          },
                          {
                            path: "metadata",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/[id]/metadata"),
                          },
                          {
                            path: "shipping-profile",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/[id]/shipping-profile"),
                          },
                          {
                            path: "variants/create",
                            handle: { permissions: "products:edit" },
                            lazy: () =>
                              import("./pages/products/[id]/variants/create"),
                          },
                        ],
                      },
                      {
                        path: "variants/:variant_id",
                        lazy: async () => {
                          const { loader, Breadcrumb } =
                            await import("./pages/product-variants/product-variant-detail");
                          return {
                            Component: Outlet,
                            loader: withPermission(loader, "products:view"),
                            handle: {
                              breadcrumb: (match: UIMatch<any>) => (
                                <Breadcrumb {...match} />
                              ),
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
                                path: "media",
                                handle: { permissions: "products:edit" },
                                lazy: () =>
                                  import("./pages/product-variants/product-variant-detail/media"),
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },

              // ORDERS
              {
                path: "/orders",
                errorElement: <ErrorBoundary />,
                handle: { breadcrumb: () => t("orders.domain"), permissions: "orders:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { OrderListPage } = await import("./pages/orders");
                      return { Component: OrderListPage };
                    },
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { loader } = await import("./pages/orders/[id]");
                      const { Breadcrumb } =
                        await import("./pages/orders/[id]/breadcrumb");
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "orders:view"),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { OrderDetailPage } =
                            await import("./pages/orders/[id]");
                          return { Component: OrderDetailPage };
                        },
                        children: [
                          {
                            path: "fulfillment",
                            handle: { permissions: "orders:edit" },
                            lazy: () =>
                              import("./pages/orders/[id]/fulfillment"),
                          },
                          {
                            path: "allocate-items",
                            handle: { permissions: "reservations:edit" },
                            lazy: () =>
                              import("./pages/orders/[id]/allocate-items"),
                          },
                          {
                            path: ":f_id/create-shipment",
                            handle: { permissions: "orders:edit" },
                            lazy: () => import("./pages/orders/[id]/shipment"),
                          },
                          {
                            path: "returns/create",
                            handle: { permissions: "orders.returns:edit" },
                            lazy: () =>
                              import("./pages/orders/[id]/returns/create"),
                          },
                          {
                            path: "returns/:return_id/receive",
                            handle: { permissions: "orders.returns:edit" },
                            lazy: () =>
                              import("./pages/orders/[id]/returns/[return_id]/receive"),
                          },
                          {
                            path: "refund",
                            handle: { permissions: "payments:edit" },
                            lazy: () => import("./pages/orders/[id]/refund"),
                          },
                          {
                            path: "edit",
                            handle: { permissions: "orders.edits:edit" },
                            lazy: () => import("./pages/orders/[id]/edit"),
                          },
                          {
                            path: "exchanges/create",
                            handle: { permissions: "orders.returns:edit" },
                            lazy: () =>
                              import("./pages/orders/[id]/exchanges/create"),
                          },
                          {
                            path: "claims/create",
                            handle: { permissions: "orders.returns:edit" },
                            lazy: () =>
                              import("./pages/orders/[id]/claims/create"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },

              // PAYOUTS
              {
                path: "/payouts",
                errorElement: <ErrorBoundary />,
                handle: { breadcrumb: () => "Payouts", permissions: "payouts:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { PayoutListPage } =
                        await import("./pages/payouts");
                      return { Component: PayoutListPage };
                    },
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb } =
                        await import("./pages/payouts/[id]/breadcrumb");
                      return {
                        Component: Outlet,
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { PayoutDetailPage } =
                            await import("./pages/payouts/[id]");
                          return { Component: PayoutDetailPage };
                        },
                      },
                    ],
                  },
                ],
              },

              // CATEGORIES
              {
                path: "/categories",
                errorElement: <ErrorBoundary />,
                handle: { breadcrumb: () => t("categories.domain"), permissions: "product_categories:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { CategoryListPage } =
                        await import("./pages/categories");
                      return {
                        Component: CategoryListPage,
                      };
                    },
                    children: [
                      {
                        path: "organize",
                        handle: { permissions: "product_categories:edit" },
                        lazy: () => import("./pages/categories/organize"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { loader } =
                        await import("./pages/categories/[id]");
                      const { Breadcrumb } =
                        await import("./pages/categories/[id]/breadcrumb");
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "product_categories:view"),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { CategoryDetailPage } =
                            await import("./pages/categories/[id]");
                          return {
                            Component: CategoryDetailPage,
                          };
                        },
                        children: [
                          {
                            path: "products",
                            handle: { permissions: ["product_categories:edit", "products:view"] },
                            lazy: () =>
                              import("./pages/categories/[id]/products"),
                          },
                          {
                            path: "organize",
                            handle: { permissions: "product_categories:edit" },
                            lazy: () =>
                              import("./pages/categories/[id]/organize"),
                          },
                          {
                            path: "metadata",
                            handle: { permissions: "product_categories:edit" },
                            lazy: () =>
                              import("./pages/categories/[id]/metadata"),
                          },
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
                handle: { breadcrumb: () => t("collections.domain"), permissions: "product_collections:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { CollectionListPage } =
                        await import("./pages/collections");
                      return {
                        Component: CollectionListPage,
                      };
                    },
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { loader } =
                        await import("./pages/collections/[id]");
                      const { Breadcrumb } =
                        await import("./pages/collections/[id]/breadcrumb");
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "product_collections:view"),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { CollectionDetailPage } =
                            await import("./pages/collections/[id]");
                          return {
                            Component: CollectionDetailPage,
                          };
                        },
                        children: [
                          {
                            path: "add-products",
                            handle: { permissions: ["product_collections:edit", "products:view"] },
                            lazy: () =>
                              import("./pages/collections/[id]/add-products"),
                          },
                          {
                            path: "metadata",
                            handle: { permissions: "product_collections:edit" },
                            lazy: () =>
                              import("./pages/collections/[id]/metadata"),
                          },
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
                handle: { breadcrumb: () => t("customers.domain"), permissions: "customers:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { CustomerListPage } =
                        await import("./pages/customers");
                      return {
                        Component: CustomerListPage,
                      };
                    },
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { loader } = await import("./pages/customers/[id]");
                      const { Breadcrumb } =
                        await import("./pages/customers/[id]/breadcrumb");
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "customers:view"),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { CustomerDetailPage } =
                            await import("./pages/customers/[id]");
                          return {
                            Component: CustomerDetailPage,
                          };
                        },
                        children: [
                          {
                            path: "add-customer-groups",
                            handle: { permissions: ["customers:edit", "customer_groups:view"] },
                            lazy: () =>
                              import("./pages/customers/[id]/add-customer-groups"),
                          },
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
                handle: { breadcrumb: () => t("customerGroups.domain"), permissions: "customer_groups:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { CustomerGroupListPage } =
                        await import("./pages/customer-groups");
                      return {
                        Component: CustomerGroupListPage,
                      };
                    },
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
                      const { loader } =
                        await import("./pages/customer-groups/customer-group-detail");
                      const { Breadcrumb } =
                        await import("./pages/customer-groups/customer-group-detail/breadcrumb");
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "customer_groups:view"),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { CustomerGroupDetailPage } =
                            await import("./pages/customer-groups/customer-group-detail");
                          return {
                            Component: CustomerGroupDetailPage,
                          };
                        },
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
                        ],
                      },
                    ],
                  },
                ],
              },

              // OFFERS
              {
                path: "/offers",
                errorElement: <ErrorBoundary />,
                handle: { breadcrumb: () => t("offers.domain"), permissions: ["offers:view", "products:view"] },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { OfferListPage } = await import("./pages/offers");
                      return { Component: OfferListPage };
                    },
                    children: [
                      {
                        path: "create",
                        handle: { permissions: ["offers:edit", "products:view"] },
                        lazy: () =>
                          import("./pages/offers/create/offer-create-page"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { loader } =
                        await import("./pages/offers/[id]/loader");
                      const { Breadcrumb } =
                        await import("./pages/offers/[id]/breadcrumb");
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, ["offers:view", "products:view"]),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { OfferDetailPage } =
                            await import("./pages/offers/[id]/offer-detail-page");
                          return { Component: OfferDetailPage };
                        },
                        children: [
                          {
                            path: "edit-price",
                            handle: { permissions: ["offers:edit", "products:view"] },
                            lazy: () =>
                              import("./pages/offers/[id]/edit-price"),
                          },
                          {
                            path: "edit-stock",
                            handle: { permissions: ["offers:edit", "products:view"] },
                            lazy: () =>
                              import("./pages/offers/[id]/edit-stock"),
                          },
                        ],
                      },
                      {
                        path: "variants/:offer_id",
                        lazy: async () => {
                          const { loader } =
                            await import("./pages/offers/[id]/variants/[offer_id]/loader");
                          const { Breadcrumb } =
                            await import("./pages/offers/[id]/variants/[offer_id]/breadcrumb");
                          return {
                            Component: Outlet,
                            loader: withPermission(loader, ["offers:view", "products:view"]),
                            handle: {
                              breadcrumb: (match: UIMatch<any>) => (
                                <Breadcrumb {...match} />
                              ),
                            },
                          };
                        },
                        children: [
                          {
                            path: "",
                            lazy: async () => {
                              const { OfferVariantDetailPage } =
                                await import("./pages/offers/[id]/variants/[offer_id]/offer-variant-detail-page");
                              return { Component: OfferVariantDetailPage };
                            },
                            children: [
                              {
                                path: "edit",
                                handle: { permissions: ["offers:edit", "products:view"] },
                                lazy: () =>
                                  import("./pages/offers/[id]/variants/[offer_id]/edit"),
                              },
                              {
                                path: "shipping",
                                handle: { permissions: ["offers:edit", "products:view"] },
                                lazy: () =>
                                  import("./pages/offers/[id]/variants/[offer_id]/shipping"),
                              },
                              {
                                path: "pricing",
                                handle: { permissions: ["offers:edit", "products:view"] },
                                lazy: () =>
                                  import("./pages/offers/[id]/variants/[offer_id]/pricing"),
                              },
                              {
                                path: "inventory",
                                handle: { permissions: ["offers:edit", "products:view"] },
                                lazy: () =>
                                  import("./pages/offers/[id]/variants/[offer_id]/inventory"),
                              },
                              {
                                path: "manage-items",
                                handle: { permissions: ["offers:edit", "products:view"] },
                                lazy: () =>
                                  import("./pages/offers/[id]/variants/[offer_id]/manage-items"),
                              },
                            ],
                          },
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
                handle: { breadcrumb: () => t("inventory.domain"), permissions: "inventory_items:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { InventoryListPage } =
                        await import("./pages/inventory");
                      return {
                        Component: InventoryListPage,
                      };
                    },
                    children: [
                      {
                        path: "create",
                        handle: { permissions: ["inventory_items:edit", "stock_locations:view"] },
                        lazy: () => import("./pages/inventory/create"),
                      },
                      {
                        path: "stock",
                        handle: { permissions: ["inventory_items:edit", "stock_locations:view"] },
                        lazy: () => import("./pages/inventory/[id]/stock"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { loader } = await import("./pages/inventory/[id]");
                      const { Breadcrumb } =
                        await import("./pages/inventory/[id]/breadcrumb");
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "inventory_items:view"),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { InventoryDetailPage } =
                            await import("./pages/inventory/[id]");
                          return {
                            Component: InventoryDetailPage,
                          };
                        },
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "inventory_items:edit" },
                            lazy: () =>
                              import("./pages/inventory/[id]/_components/edit-inventory-item"),
                          },
                          {
                            path: "attributes",
                            handle: { permissions: "inventory_items:edit" },
                            lazy: () =>
                              import("./pages/inventory/[id]/_components/edit-inventory-item-attributes"),
                          },
                          {
                            path: "metadata",
                            handle: { permissions: "inventory_items:edit" },
                            lazy: () =>
                              import("./pages/inventory/[id]/metadata"),
                          },
                          {
                            path: "locations",
                            handle: { permissions: ["inventory_items:edit", "stock_locations:view"] },
                            lazy: () =>
                              import("./pages/inventory/[id]/_components/manage-locations"),
                          },
                          {
                            path: "locations/:location_id",
                            handle: { permissions: "inventory_items:edit" },
                            lazy: () =>
                              import("./pages/inventory/[id]/_components/adjust-inventory"),
                          },
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
                handle: { breadcrumb: () => t("promotions.domain"), permissions: "promotions:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { PromotionListPage } =
                        await import("./pages/promotions");
                      return {
                        Component: PromotionListPage,
                      };
                    },
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "promotions:edit" },
                        lazy: () => import("./pages/promotions/create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { loader } =
                        await import("./pages/promotions/[id]");
                      const { Breadcrumb } =
                        await import("./pages/promotions/[id]/breadcrumb");
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "promotions:view"),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { PromotionDetailPage } =
                            await import("./pages/promotions/[id]");
                          return {
                            Component: PromotionDetailPage,
                          };
                        },
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "promotions:edit" },
                            lazy: () => import("./pages/promotions/[id]/edit"),
                          },
                          {
                            path: "add-to-campaign",
                            handle: { permissions: ["promotions:edit", "campaigns:view"] },
                            lazy: () =>
                              import("./pages/promotions/[id]/add-to-campaign"),
                          },
                          {
                            path: ":ruleType/edit",
                            handle: { permissions: "promotions:edit" },
                            lazy: () =>
                              import("./pages/promotions/[id]/[ruleType]/edit"),
                          },
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
                handle: { breadcrumb: () => t("campaigns.domain"), permissions: "campaigns:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { CampaignListPage } =
                        await import("./pages/campaigns");
                      return {
                        Component: CampaignListPage,
                      };
                    },
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "campaigns:edit" },
                        lazy: () => import("./pages/campaigns/create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { loader } = await import("./pages/campaigns/[id]");
                      const { Breadcrumb } =
                        await import("./pages/campaigns/[id]/breadcrumb");
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "campaigns:view"),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { CampaignDetailPage } =
                            await import("./pages/campaigns/[id]");
                          return {
                            Component: CampaignDetailPage,
                          };
                        },
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "campaigns:edit" },
                            lazy: () => import("./pages/campaigns/[id]/edit"),
                          },
                          {
                            path: "configuration",
                            handle: { permissions: "campaigns:edit" },
                            lazy: () =>
                              import("./pages/campaigns/[id]/configuration"),
                          },
                          {
                            path: "edit-budget",
                            handle: { permissions: "campaigns:edit" },
                            lazy: () =>
                              import("./pages/campaigns/[id]/edit-budget"),
                          },
                          {
                            path: "add-promotions",
                            handle: { permissions: ["campaigns:edit", "promotions:view"] },
                            lazy: async () => {
                              const { AddPromotionsPage } =
                                await import("./pages/campaigns/[id]/add-promotions");
                              return {
                                Component: AddPromotionsPage,
                              };
                            },
                          },
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
                handle: { breadcrumb: () => t("priceLists.domain"), permissions: "price_lists:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { PriceListListPage } =
                        await import("./pages/price-lists");
                      return { Component: PriceListListPage };
                    },
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "price_lists:edit" },
                        lazy: () => import("./pages/price-lists/create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { loader } =
                        await import("./pages/price-lists/[id]");
                      const { Breadcrumb } =
                        await import("./pages/price-lists/[id]/breadcrumb");
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "price_lists:view"),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { PriceListDetailPage } =
                            await import("./pages/price-lists/[id]");
                          return { Component: PriceListDetailPage };
                        },
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "price_lists:edit" },
                            lazy: () => import("./pages/price-lists/[id]/edit"),
                          },
                          {
                            path: "configuration",
                            handle: { permissions: "price_lists:edit" },
                            lazy: () =>
                              import("./pages/price-lists/[id]/configuration"),
                          },
                          {
                            path: "customer-availability",
                            handle: { permissions: "price_lists:edit" },
                            lazy: () =>
                              import(
                                "./pages/price-lists/[id]/customer-availability"
                              ),
                          },
                          {
                            path: "products/add",
                            handle: { permissions: "price_lists:edit" },
                            lazy: () =>
                              import("./pages/price-lists/[id]/products/add"),
                          },
                          {
                            path: "products/edit",
                            handle: { permissions: "price_lists:edit" },
                            lazy: () =>
                              import("./pages/price-lists/[id]/products/edit"),
                          },
                          {
                            path: "products/:variant_id/edit",
                            handle: { permissions: "price_lists:edit" },
                            lazy: () =>
                              import("./pages/price-lists/[id]/products/[variant_id]/edit"),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },

              // REVIEWS
              {
                path: "/reviews",
                errorElement: <ErrorBoundary />,
                handle: { breadcrumb: () => t("reviews.domain"), permissions: "reviews:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { ReviewListPage } = await import("./pages/reviews");
                      return {
                        Component: ReviewListPage,
                      };
                    },
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { loader } = await import("./pages/reviews/[id]");
                      const { Breadcrumb } = await import(
                        "./pages/reviews/[id]/breadcrumb"
                      );
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "reviews:view"),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { ReviewDetailPage } = await import(
                            "./pages/reviews/[id]"
                          );
                          return {
                            Component: ReviewDetailPage,
                          };
                        },
                        children: [
                          {
                            path: "respond",
                            handle: { permissions: "reviews:edit" },
                            lazy: () => import("./pages/reviews/[id]/respond"),
                          },
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
                handle: { breadcrumb: () => t("reservations.domain"), permissions: "reservations:view" },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/reservations"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "reservations:edit" },
                        lazy: () => import("./pages/reservations/create"),
                      },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { Breadcrumb } = await import(
                        "./pages/reservations/[id]"
                      );
                      return {
                        Component: Outlet,
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: () => import("./pages/reservations/[id]"),
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "reservations:edit" },
                            lazy: () =>
                              import(
                                "./pages/reservations/[id]/_components/edit-reservation"
                              ),
                          },
                          {
                            path: "metadata/edit",
                            handle: { permissions: "reservations:edit" },
                            lazy: () =>
                              import("./pages/reservations/[id]/metadata"),
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

    // PROTECTED - SETTINGS LAYOUT
    {
      element: <ProtectedRoute />,
      errorElement: <ErrorBoundary />,
      children: [
        {
          path: "/settings",
          element: <SettingsLayout />,
          children: [
            {
              element: <RoutePermissionGuard />,
              children: mergeRoutes(
            [
              {
                index: true,
                errorElement: <ErrorBoundary />,
                lazy: () => import("./pages/settings/settings"),
              },

              // PROFILE
              {
                path: "profile",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("profile.domain"),
                },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { ProfileDetailPage } =
                        await import("./pages/settings/profile");
                      return { Component: ProfileDetailPage };
                    },
                    children: [
                      {
                        path: "edit",
                        lazy: async () => {
                          const { ProfileEdit } =
                            await import("./pages/settings/profile");
                          return { Component: ProfileEdit };
                        },
                      },
                    ],
                  },
                ],
              },

              // STORE
              {
                path: "store",
                errorElement: <ErrorBoundary />,
                handle: {
                  breadcrumb: () => t("app.menus.store.label"),
                  permissions: "store:view",
                },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { StoreDetailPage } =
                        await import("./pages/settings/store");
                      return { Component: StoreDetailPage };
                    },
                    children: [
                      {
                        path: "edit",
                        handle: { permissions: "store:edit" },
                        lazy: () => import("./pages/settings/store/edit"),
                      },
                      {
                        path: "address",
                        handle: { permissions: "store:edit" },
                        lazy: () => import("./pages/settings/store/address"),
                      },
                      {
                        path: "payment-details",
                        handle: { permissions: "store:edit" },
                        lazy: () =>
                          import("./pages/settings/store/payment-details"),
                      },
                      {
                        path: "professional-details",
                        handle: { permissions: "store:edit" },
                        lazy: () =>
                          import("./pages/settings/store/professional-details"),
                      },
                      {
                        path: "store-closure",
                        handle: { permissions: "store:edit" },
                        lazy: () =>
                          import("./pages/settings/store/store-closure"),
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
                handle: { breadcrumb: () => t("locations.domain"), permissions: "stock_locations:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { LocationListPage } =
                        await import("./pages/settings/locations");
                      return { Component: LocationListPage };
                    },
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "stock_locations:edit" },
                        lazy: () => import("./pages/settings/locations/create"),
                      },
                    ],
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
                        lazy: async () => {
                          const { ShippingProfileListPage } =
                            await import("./pages/settings/shipping-profiles");
                          return { Component: ShippingProfileListPage };
                        },
                      },
                      {
                        path: ":shipping_profile_id",
                        lazy: async () => {
                          const { shippingProfileLoader: loader } =
                            await import("./pages/settings/shipping-profiles/[id]");
                          const {
                            ShippingProfileDetailBreadcrumb: Breadcrumb,
                          } =
                            await import("./pages/settings/shipping-profiles/[id]/breadcrumb");
                          return {
                            Component: Outlet,
                            loader: withPermission(loader, "shipping_profiles:view"),
                            handle: {
                              breadcrumb: (match: UIMatch<any>) => (
                                <Breadcrumb {...match} />
                              ),
                            },
                          };
                        },
                        children: [
                          {
                            path: "",
                            lazy: async () => {
                              const { ShippingProfileDetailPage } =
                                await import("./pages/settings/shipping-profiles/[id]");
                              return {
                                Component: ShippingProfileDetailPage,
                              };
                            },
                          },
                        ],
                      },
                    ],
                  },
                  {
                    path: ":location_id",
                    lazy: async () => {
                      const { loader } =
                        await import("./pages/settings/locations/[location_id]");
                      const { LocationDetailBreadcrumb: Breadcrumb } =
                        await import("./pages/settings/locations/[location_id]/breadcrumb");
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "stock_locations:view"),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { LocationDetailPage } =
                            await import("./pages/settings/locations/[location_id]");
                          return { Component: LocationDetailPage };
                        },
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "stock_locations:edit" },
                            lazy: () =>
                              import("./pages/settings/locations/[location_id]/edit"),
                          },
                          {
                            path: "sales-channels",
                            handle: { permissions: ["stock_locations:edit", "sales_channels:view"] },
                            lazy: () =>
                              import("./pages/settings/locations/[location_id]/sales-channels"),
                          },
                          {
                            path: "fulfillment-providers",
                            handle: { permissions: ["stock_locations:edit", "fulfillment_sets:view"] },
                            lazy: () =>
                              import("./pages/settings/locations/[location_id]/fulfillment-providers"),
                          },
                          {
                            path: "fulfillment-set/:fset_id/service-zones/create",
                            handle: { permissions: "fulfillment_sets:edit" },
                            lazy: () =>
                              import("./pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zones/create"),
                          },
                          {
                            path: "fulfillment-set/:fset_id/service-zone/:zone_id/edit",
                            handle: { permissions: "fulfillment_sets:edit" },
                            lazy: () =>
                              import("./pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/edit"),
                          },
                          {
                            path: "fulfillment-set/:fset_id/service-zone/:zone_id/areas",
                            handle: { permissions: "fulfillment_sets:edit" },
                            lazy: () =>
                              import("./pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/areas"),
                          },
                          {
                            path: "fulfillment-set/:fset_id/service-zone/:zone_id/shipping-option/create",
                            handle: { permissions: "shipping_options:edit" },
                            lazy: () =>
                              import("./pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/shipping-option/create"),
                          },
                          {
                            path: "fulfillment-set/:fset_id/service-zone/:zone_id/shipping-option/:so_id/edit",
                            handle: { permissions: "shipping_options:edit" },
                            lazy: () =>
                              import("./pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/shipping-option/[so_id]/edit"),
                          },
                          {
                            path: "fulfillment-set/:fset_id/service-zone/:zone_id/shipping-option/:so_id/pricing",
                            handle: { permissions: "shipping_options:edit" },
                            lazy: () =>
                              import("./pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/shipping-option/[so_id]/pricing"),
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
                handle: { breadcrumb: () => t("productTags.domain"), permissions: "product_tags:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { ProductTagListPage } =
                        await import("./pages/settings/product-tags");
                      return { Component: ProductTagListPage };
                    },
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { loader } =
                        await import("./pages/settings/product-tags/[id]");
                      const { ProductTagDetailBreadcrumb: Breadcrumb } =
                        await import("./pages/settings/product-tags/[id]/breadcrumb");
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "product_tags:view"),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { ProductTagDetailPage } =
                            await import("./pages/settings/product-tags/[id]");
                          return { Component: ProductTagDetailPage };
                        },
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "product_tags:edit" },
                            lazy: () =>
                              import("./pages/settings/product-tags/[id]/edit"),
                          },
                        ],
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
                handle: { breadcrumb: () => t("users.domain"), permissions: "members:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { TeamListPage } =
                        await import("./pages/settings/team");
                      return { Component: TeamListPage };
                    },
                    children: [
                      {
                        path: "invite",
                        handle: { permissions: "members:edit" },
                        lazy: async () => {
                          const { TeamInvite } =
                            await import("./pages/settings/team/invite");

                          return { Component: TeamInvite };
                        },
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
                handle: { breadcrumb: () => t("productTypes.domain"), permissions: "product_types:view" },
                children: [
                  {
                    path: "",
                    lazy: async () => {
                      const { ProductTypeListPage } =
                        await import("./pages/settings/product-types");
                      return { Component: ProductTypeListPage };
                    },
                    children: [
                      // TODO: Enable when request product type flow is implemented
                      // {
                      //   path: "create",
                      //   lazy: () =>
                      //     import("./pages/settings/product-types/create"),
                      // },
                    ],
                  },
                  {
                    path: ":id",
                    lazy: async () => {
                      const { productTypeLoader: loader } =
                        await import("./pages/settings/product-types/[id]");
                      const { ProductTypeDetailBreadcrumb: Breadcrumb } =
                        await import("./pages/settings/product-types/[id]/breadcrumb");
                      return {
                        Component: Outlet,
                        loader: withPermission(loader, "product_types:view"),
                        handle: {
                          breadcrumb: (match: UIMatch<any>) => (
                            <Breadcrumb {...match} />
                          ),
                        },
                      };
                    },
                    children: [
                      {
                        path: "",
                        lazy: async () => {
                          const { ProductTypeDetailPage } =
                            await import("./pages/settings/product-types/[id]");
                          return { Component: ProductTypeDetailPage };
                        },
                        children: [
                          {
                            path: "edit",
                            handle: { permissions: "product_types:edit" },
                            lazy: () =>
                              import("./pages/settings/product-types/[id]/edit"),
                          },
                        ],
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
                handle: { breadcrumb: () => t("returnReasons.domain"), permissions: "return_reasons:view" },
                children: [
                  {
                    path: "",
                    lazy: () => import("./pages/settings/return-reasons"),
                    children: [
                      {
                        path: "create",
                        handle: { permissions: "return_reasons:edit" },
                        lazy: () =>
                          import("./pages/settings/return-reasons/create"),
                      },
                      {
                        path: ":id/edit",
                        handle: { permissions: "return_reasons:edit" },
                        lazy: () =>
                          import("./pages/settings/return-reasons/[id]/edit"),
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

    // PUBLIC LAYOUT
    {
      element: <PublicLayout />,
      children: [
        {
          errorElement: <ErrorBoundary />,
          children: [
            {
              path: "/login",
              lazy: async () => {
                const { LoginPage } = await import("./pages/login");
                return { Component: LoginPage };
              },
            },
            {
              path: "/reset-password",
              lazy: () => import("./pages/reset-password"),
            },
            {
              path: "/register",
              lazy: async () => {
                const { RegisterPage } = await import("./pages/register");
                return { Component: RegisterPage };
              },
            },
            {
              path: "/onboarding",
              lazy: () => import("./pages/onboarding"),
            },
            {
              path: "/invite",
              lazy: () => import("./pages/invite"),
            },
            {
              path: "/store-select",
              lazy: async () => {
                const { StoreSelectPage } =
                  await import("./pages/store-select");
                return { Component: StoreSelectPage };
              },
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
