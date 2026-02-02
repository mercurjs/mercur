import type { HttpTypes } from "@medusajs/types";

import { t } from "i18next";
import { Outlet, type RouteObject, type UIMatch } from "react-router-dom";

import { ProtectedRoute } from "@components/authentication/protected-route";
import { MainLayout } from "@components/layout/main-layout";
import { PublicLayout } from "@components/layout/public-layout";
import { SettingsLayout } from "@components/layout/settings-layout";
import { ErrorBoundary } from "@components/utilities/error-boundary";


export function getRouteMap({
  settingsRoutes,
  coreRoutes,
}: {
  settingsRoutes: RouteObject[];
  coreRoutes: RouteObject[];
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
              path: "/",
              errorElement: <ErrorBoundary />,
              lazy: () => import("../../pages/home"),
            },
            {
              path: "/products",
              errorElement: <ErrorBoundary />,
              handle: {
                breadcrumb: () => t("products.domain"),
              },
              children: [
                {
                  path: "",
                  // Uses compound component from products/index.tsx
                  // User can override this file to customize the products list page
                  lazy: () => import("../../pages/products"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/products/create"),
                    },
                    {
                      path: "import",
                      lazy: () =>
                        import("../../pages/products/import"),
                    },
                    {
                      path: "export",
                      lazy: () =>
                        import("../../pages/products/export"),
                    },
                  ],
                },
                {
                  path: ":id",
                  errorElement: <ErrorBoundary />,
                  lazy: async () => {
                    // Uses file-based routing path - user can override
                    const { Breadcrumb, loader } = await import(
                      "../../pages/products/[id]"
                    );

                    return {
                      Component: Outlet,
                      loader,
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
                      lazy: () =>
                        import("../../pages/products/[id]"),
                      children: [
                        {
                          path: "edit",
                          lazy: () =>
                            import("../../pages/products/[id]/edit"),
                        },
                        {
                          path: "edit-variant",
                          lazy: () =>
                            import(
                              "../../pages/product-variants/[variant_id]/edit"
                            ),
                        },
                        {
                          path: "sales-channels",
                          lazy: () =>
                            import("../../pages/products/[id]/sales-channels"),
                        },
                        {
                          path: "attributes",
                          lazy: () =>
                            import("../../pages/products/[id]/attributes"),
                        },
                        {
                          path: "organization",
                          lazy: () =>
                            import("../../pages/products/[id]/organization"),
                        },
                        {
                          path: "shipping-profile",
                          lazy: () =>
                            import("../../pages/products/[id]/shipping-profile"),
                        },
                        {
                          path: "media",
                          lazy: () =>
                            import("../../pages/products/[id]/media"),
                        },
                        {
                          path: "prices",
                          lazy: () =>
                            import("../../pages/products/[id]/prices"),
                        },
                        {
                          path: "options/create",
                          lazy: () =>
                            import("../../pages/products/[id]/options/create"),
                        },
                        {
                          path: "options/:option_id/edit",
                          lazy: () =>
                            import("../../pages/products/[id]/options/[option_id]/edit"),
                        },
                        {
                          path: "variants/create",
                          lazy: () =>
                            import("../../pages/products/[id]/variants/create"),
                        },
                        {
                          path: "stock",
                          lazy: () =>
                            import("../../pages/products/[id]/stock"),
                        },
                        {
                          path: "metadata/edit",
                          lazy: () =>
                            import("../../pages/products/[id]/metadata"),
                        },
                      ],
                    },
                    {
                      path: "variants/:variant_id",
                      lazy: async () => {
                        const { Component, Breadcrumb, loader } = await import(
                          "../../pages/product-variants/[variant_id]"
                        );

                        return {
                          Component,
                          loader,
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
                          path: "edit",
                          lazy: () =>
                            import(
                              "../../pages/product-variants/[variant_id]/edit"
                            ),
                        },
                        {
                          path: "prices",
                          lazy: () =>
                            import("../../pages/products/[id]/prices"),
                        },
                        {
                          path: "manage-items",
                          lazy: () =>
                            import(
                              "../../pages/product-variants/[variant_id]/manage-items"
                            ),
                        },
                        {
                          path: "metadata/edit",
                          lazy: () =>
                            import(
                              "../../pages/product-variants/[variant_id]/metadata"
                            ),
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
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/categories"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/categories/create"),
                    },
                    {
                      path: "organize",
                      lazy: () =>
                        import("../../pages/categories/[id]/organize"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "../../pages/categories/[id]"
                    );

                    return {
                      Component: Outlet,
                      loader,
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
                        import("../../pages/categories/[id]"),
                      children: [
                        {
                          path: "edit",
                          lazy: () =>
                            import("../../pages/categories/[id]/edit"),
                        },
                        {
                          path: "products",
                          lazy: () =>
                            import("../../pages/categories/[id]/products"),
                        },
                        {
                          path: "organize",
                          lazy: () =>
                            import("../../pages/categories/[id]/organize"),
                        },
                        {
                          path: "metadata/edit",
                          lazy: () =>
                            import("../../pages/categories/[id]/metadata"),
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
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/orders"),
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "../../pages/orders/[id]"
                    );

                    return {
                      Component: Outlet,
                      loader,
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
                      lazy: () =>
                        import("../../pages/orders/[id]"),
                    },
                    {
                      path: "fulfillment",
                      lazy: () =>
                        import("../../pages/orders/[id]/fulfillment"),
                    },
                    {
                      path: "returns/:return_id/receive",
                      lazy: () =>
                        import("../../pages/orders/[id]/returns/[return_id]/receive"),
                    },
                    {
                      path: "allocate-items",
                      lazy: () =>
                        import("../../pages/orders/[id]/allocate-items"),
                    },
                    {
                      path: ":f_id/create-shipment",
                      lazy: () =>
                        import("../../pages/orders/[id]/[f_id]/create-shipment"),
                    },
                    {
                      path: "returns",
                      lazy: () =>
                        import("../../pages/orders/[id]/returns"),
                    },
                    {
                      path: "claims",
                      lazy: () =>
                        import("../../pages/orders/[id]/claims"),
                    },
                    {
                      path: "exchanges",
                      lazy: () =>
                        import("../../pages/orders/[id]/exchanges"),
                    },
                    {
                      path: "edits",
                      lazy: () =>
                        import("../../pages/orders/[id]/edits"),
                    },
                    {
                      path: "refund",
                      lazy: () =>
                        import("../../pages/orders/[id]/refund"),
                    },
                    {
                      path: "email",
                      lazy: () =>
                        import("../../pages/orders/[id]/email"),
                    },
                    {
                      path: "shipping-address",
                      lazy: () =>
                        import("../../pages/orders/[id]/shipping-address"),
                    },
                    {
                      path: "billing-address",
                      lazy: () =>
                        import("../../pages/orders/[id]/billing-address"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("../../pages/orders/[id]/metadata"),
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
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/promotions"),
                },
                {
                  path: "create",
                  lazy: () =>
                    import("../../pages/promotions/create"),
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/promotions/[id]"
                    );

                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (
                          match: UIMatch<HttpTypes.AdminPromotionResponse>,
                        ) => <Breadcrumb {...match} />,
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () =>
                        import(
                          "../../pages/promotions/[id]/edit"
                        ),
                    },
                    {
                      path: "add-to-campaign",
                      lazy: () =>
                        import(
                          "../../pages/promotions/[id]/add-to-campaign"
                        ),
                    },
                    {
                      path: ":ruleType/edit",
                      lazy: () =>
                        import("../../pages/promotions/[id]/[ruleType]/edit"),
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
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/campaigns"),
                  children: [],
                },
                {
                  path: "create",
                  lazy: () => import("../../pages/campaigns/create"),
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/campaigns/[id]"
                    );

                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (
                          match: UIMatch<HttpTypes.AdminCampaignResponse>,
                        ) => <Breadcrumb {...match} />,
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () =>
                        import("../../pages/campaigns/[id]/edit"),
                    },
                    {
                      path: "configuration",
                      lazy: () =>
                        import("../../pages/campaigns/[id]/configuration"),
                    },
                    {
                      path: "edit-budget",
                      lazy: () =>
                        import("../../pages/campaigns/[id]/budget/edit"),
                    },
                    {
                      path: "add-promotions",
                      lazy: () =>
                        import(
                          "../../pages/campaigns/[id]/promotions/add"
                        ),
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
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/collections"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/collections/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "../../pages/collections/[id]"
                    );

                    return {
                      Component: Outlet,
                      loader,
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
                        import("../../pages/collections/[id]"),
                    },
                    {
                      path: "edit",
                      lazy: () =>
                        import("../../pages/collections/[id]/edit"),
                    },
                    {
                      path: "products",
                      lazy: () =>
                        import("../../pages/collections/[id]/products"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("../../pages/collections/[id]/metadata"),
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
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/price-lists"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("../../pages/price-lists/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/price-lists/[id]"
                    );

                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (
                          match: UIMatch<HttpTypes.AdminPriceListResponse>,
                        ) => <Breadcrumb {...match} />,
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () => import("../../pages/price-lists/[id]/edit"),
                    },
                    {
                      path: "configuration",
                      lazy: () =>
                        import("../../pages/price-lists/[id]/configuration"),
                    },
                    {
                      path: "products/add",
                      lazy: () =>
                        import("../../pages/price-lists/[id]/products/add"),
                    },
                    {
                      path: "products/edit",
                      lazy: () =>
                        import("../../pages/price-lists/[id]/products/edit"),
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
              },
              children: [
                {
                  path: "",
                  // Uses file-based routing - user can override this file
                  lazy: () => import("../../pages/customers"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/customers/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    // Uses file-based routing path - user can override
                    const { Breadcrumb, loader } = await import(
                      "../../pages/customers/[id]"
                    );

                    return {
                      Component: Outlet,
                      loader,
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
                      lazy: () =>
                        import("../../pages/customers/[id]"),
                    },
                    {
                      path: "edit",
                      lazy: () =>
                        import("../../pages/customers/[id]/edit"),
                    },
                    {
                      path: "create-address",
                      lazy: () =>
                        import("../../pages/customers/[id]/create-address"),
                    },
                    {
                      path: "add-customer-groups",
                      lazy: () =>
                        import("../../pages/customers/[id]/add-customer-groups"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("../../pages/customers/[id]/metadata/edit"),
                    },
                  ],
                },
              ],
            },
            {
              path: "/sellers",
              errorElement: <ErrorBoundary />,
              handle: {
                breadcrumb: () => t("sellers.domain"),
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/sellers"),
                },
                {
                  path: ":id",
                  lazy: () => import("../../pages/sellers/[id]"),
                },
                {
                  path: ":id/edit",
                  lazy: () => import("../../pages/sellers/[id]/edit"),
                },
              ],
            },
            {
              path: "/customer-groups",
              errorElement: <ErrorBoundary />,
              handle: {
                breadcrumb: () => t("customerGroups.domain"),
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/customer-groups"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/customer-groups/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "../../pages/customer-groups/[id]"
                    );

                    return {
                      Component: Outlet,
                      loader,
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
                        import("../../pages/customer-groups/[id]"),
                    },
                    {
                      path: "edit",
                      lazy: () =>
                        import("../../pages/customer-groups/[id]/edit"),
                    },
                    {
                      path: "add-customers",
                      lazy: () =>
                        import("../../pages/customer-groups/[id]/add-customers"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("../../pages/customer-groups/[id]/metadata"),
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
              },
              children: [
                {
                  path: "",
                  lazy: () =>
                    import("../../pages/reservations"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/reservations/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/reservations/[id]"
                    );

                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (
                          match: UIMatch<HttpTypes.AdminReservationResponse>,
                        ) => <Breadcrumb {...match} />,
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () =>
                        import(
                          "../../pages/reservations/[id]/edit"
                        ),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import(
                          "../../pages/reservations/[id]/metadata"
                        ),
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
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/inventory"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("../../pages/inventory/create"),
                    },
                    {
                      path: "stock",
                      lazy: () => import("../../pages/inventory/stock"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/inventory/[id]"
                    );

                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (
                          match: UIMatch<HttpTypes.AdminInventoryItemResponse>,
                        ) => <Breadcrumb {...match} />,
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () => import("../../pages/inventory/[id]/edit"),
                    },
                    {
                      path: "attributes",
                      lazy: () =>
                        import("../../pages/inventory/[id]/attributes"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("../../pages/inventory/[id]/metadata/edit"),
                    },
                    {
                      path: "locations",
                      lazy: () =>
                        import("../../pages/inventory/[id]/locations"),
                    },
                    {
                      path: "locations/:location_id",
                      lazy: () =>
                        import(
                          "../../pages/inventory/[id]/locations/[location_id]"
                        ),
                    },
                  ],
                },
              ],
            },
            ...coreRoutes,
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
              index: true,
              errorElement: <ErrorBoundary />,
              lazy: () => import("../../pages/settings"),
            },
            {
              path: "profile",
              errorElement: <ErrorBoundary />,
              lazy: () => import("../../pages/profile"),
              handle: {
                breadcrumb: () => t("profile.domain"),
              },
              children: [
                {
                  path: "edit",
                  lazy: () => import("../../pages/profile/edit"),
                },
              ],
            },
            {
              path: "regions",
              errorElement: <ErrorBoundary />,
              element: <Outlet />,
              handle: {
                breadcrumb: () => t("regions.domain"),
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/regions"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("../../pages/regions/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/regions/[id]"
                    );

                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (
                          match: UIMatch<HttpTypes.AdminRegionResponse>,
                        ) => <Breadcrumb {...match} />,
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () => import("../../pages/regions/[id]/edit"),
                    },
                    {
                      path: "countries/add",
                      lazy: () =>
                        import("../../pages/regions/[id]/countries/add"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("../../pages/regions/[id]/metadata"),
                    },
                  ],
                },
              ],
            },
            {
              path: "store",
              errorElement: <ErrorBoundary />,
              lazy: () => import("../../pages/store"),
              handle: {
                breadcrumb: () => t("store.domain"),
              },
              children: [
                {
                  path: "edit",
                  lazy: () => import("../../pages/store/edit"),
                },
                {
                  path: "currencies",
                  lazy: () => import("../../pages/store/currencies"),
                },
                {
                  path: "metadata/edit",
                  lazy: () => import("../../pages/store/metadata"),
                },
              ],
            },
            {
              path: "users",
              errorElement: <ErrorBoundary />,
              element: <Outlet />,
              handle: {
                breadcrumb: () => t("users.domain"),
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/users"),
                  children: [
                    {
                      path: "invite",
                      lazy: () => import("../../pages/users/invite"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/users/[id]"
                    );

                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (
                          match: UIMatch<HttpTypes.AdminUserResponse>,
                        ) => <Breadcrumb {...match} />,
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () => import("../../pages/users/[id]/edit"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () => import("../../pages/users/[id]/metadata"),
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
              },
              children: [
                {
                  path: "",
                  lazy: () =>
                    import("../../pages/sales-channels"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import(
                          "../../pages/sales-channels/create"
                        ),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/sales-channels/[id]"
                    );

                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (
                          match: UIMatch<HttpTypes.AdminSalesChannelResponse>,
                        ) => <Breadcrumb {...match} />,
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () =>
                        import(
                          "../../pages/sales-channels/[id]/edit"
                        ),
                    },
                    {
                      path: "add-products",
                      lazy: () =>
                        import(
                          "../../pages/sales-channels/[id]/add-products"
                        ),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import(
                          "../../pages/sales-channels/[id]/metadata"
                        ),
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
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/locations"),
                },
                {
                  path: "create",
                  lazy: () => import("../../pages/locations/create"),
                },
                {
                  path: "shipping-profiles",
                  element: <Outlet />,
                  handle: {
                    breadcrumb: () => t("shippingProfile.domain"),
                  },
                  children: [
                    {
                      path: "",
                      lazy: () => import("../../pages/shipping-profiles"),
                      children: [
                        {
                          path: "create",
                          lazy: () =>
                            import("../../pages/shipping-profiles/create"),
                        },
                      ],
                    },
                    {
                      path: ":shipping_profile_id",
                      lazy: async () => {
                        const { Component, Breadcrumb, loader } = await import(
                          "../../pages/shipping-profiles/[shipping_profile_id]"
                        );

                        return {
                          Component,
                          loader,
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
                          path: "metadata/edit",
                          lazy: () =>
                            import(
                              "../../pages/shipping-profiles/[shipping_profile_id]/metadata"
                            ),
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
                  },
                  children: [
                    {
                      path: "",
                      lazy: () =>
                        import("../../pages/shipping-option-types"),
                      children: [
                        {
                          path: "create",
                          lazy: () =>
                            import(
                              "../../pages/shipping-option-types/create"
                            ),
                        },
                      ],
                    },
                    {
                      path: ":id",
                      lazy: async () => {
                        const { Component, Breadcrumb, loader } = await import(
                          "../../pages/shipping-option-types/[id]"
                        );

                        return {
                          Component,
                          loader,
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
                          path: "edit",
                          lazy: () =>
                            import(
                              "../../pages/shipping-option-types/[id]/edit"
                            ),
                        },
                      ],
                    },
                  ],
                },
                {
                  path: ":location_id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/locations/[location_id]"
                    );

                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (
                          match: UIMatch<HttpTypes.AdminStockLocationResponse>,
                        ) => <Breadcrumb {...match} />,
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () =>
                        import("../../pages/locations/[location_id]/edit"),
                    },
                    {
                      path: "sales-channels",
                      lazy: () =>
                        import(
                          "../../pages/locations/[location_id]/sales-channels"
                        ),
                    },
                    {
                      path: "fulfillment-providers",
                      lazy: () =>
                        import(
                          "../../pages/locations/[location_id]/fulfillment-providers"
                        ),
                    },
                    {
                      path: "fulfillment-set/:fset_id",
                      children: [
                        {
                          path: "service-zones/create",
                          lazy: () =>
                            import(
                              "../../pages/locations/[location_id]/fulfillment-set/[fset_id]/service-zones/create"
                            ),
                        },
                        {
                          path: "service-zone/:zone_id",
                          children: [
                            {
                              path: "edit",
                              lazy: () =>
                                import(
                                  "../../pages/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/edit"
                                ),
                            },
                            {
                              path: "areas",
                              lazy: () =>
                                import(
                                  "../../pages/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/areas"
                                ),
                            },
                            {
                              path: "shipping-option",
                              children: [
                                {
                                  path: "create",
                                  lazy: () =>
                                    import(
                                      "../../pages/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/shipping-option/create"
                                    ),
                                },
                                {
                                  path: ":so_id",
                                  children: [
                                    {
                                      path: "edit",
                                      lazy: () =>
                                        import(
                                          "../../pages/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/shipping-option/[so_id]/edit"
                                        ),
                                    },
                                    {
                                      path: "pricing",
                                      lazy: () =>
                                        import(
                                          "../../pages/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/shipping-option/[so_id]/pricing"
                                        ),
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
              path: "configuration",
              element: <Outlet />,
              handle: {
                breadcrumb: () => t("configuration.domain"),
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/configuration"),
                },
              ],
            },
            {
              path: "commission",
              lazy: () => import("../../pages/commission"),
              handle: {
                breadcrumb: () => t("commission.domain"),
              },
            },
            {
              path: "commission-lines",
              lazy: () => import("../../pages/commission-lines"),
              handle: {
                breadcrumb: () => t("commissionLines.domain"),
              },
            },
            {
              path: "product-tags",
              errorElement: <ErrorBoundary />,
              element: <Outlet />,
              handle: {
                breadcrumb: () => t("productTags.domain"),
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/product-tags"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/product-tags/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "../../pages/product-tags/[id]"
                    );

                    return {
                      Component: Outlet,
                      loader,
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
                        import("../../pages/product-tags/[id]"),
                    },
                    {
                      path: "edit",
                      lazy: () =>
                        import("../../pages/product-tags/[id]/edit"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("../../pages/product-tags/[id]/metadata"),
                    },
                  ],
                },
              ],
            },
            {
              path: "workflows",
              errorElement: <ErrorBoundary />,
              element: <Outlet />,
              handle: {
                breadcrumb: () => t("workflowExecutions.domain"),
              },
              children: [
                {
                  path: "",
                  lazy: () =>
                    import(
                      "../../pages/workflow-executions"
                    ),
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/workflow-executions/[id]"
                    );

                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (
                          // eslint-disable-next-line max-len
                          match: UIMatch<HttpTypes.AdminWorkflowExecutionResponse>,
                        ) => <Breadcrumb {...match} />,
                      },
                    };
                  },
                },
              ],
            },
            {
              path: "product-types",
              errorElement: <ErrorBoundary />,
              element: <Outlet />,
              handle: {
                breadcrumb: () => t("productTypes.domain"),
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/product-types"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/product-types/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "../../pages/product-types/[id]"
                    );

                    return {
                      Component: Outlet,
                      loader,
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
                        import("../../pages/product-types/[id]"),
                    },
                    {
                      path: "edit",
                      lazy: () =>
                        import("../../pages/product-types/[id]/edit"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("../../pages/product-types/[id]/metadata"),
                    },
                  ],
                },
              ],
            },
            {
              path: "algolia",
              element: <Outlet />,
              handle: {
                breadcrumb: () => t("algolia.domain"),
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/algolia"),
                },
              ],
            },
            {
              path: "publishable-api-keys",
              element: <Outlet />,
              handle: {
                breadcrumb: () => t("apiKeyManagement.domain.publishable"),
              },
              children: [
                {
                  path: "",
                  element: <Outlet />,
                  children: [
                    {
                      path: "",
                      lazy: () =>
                        import(
                          "../../pages/api-key-management"
                        ),
                      children: [
                        {
                          path: "create",
                          lazy: () =>
                            import(
                              "../../pages/api-key-management/create"
                            ),
                        },
                      ],
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/api-key-management/[id]"
                    );

                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (
                          match: UIMatch<HttpTypes.AdminApiKeyResponse>,
                        ) => <Breadcrumb {...match} />,
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () =>
                        import(
                          "../../pages/api-key-management/[id]/edit"
                        ),
                    },
                    {
                      path: "sales-channels",
                      lazy: () =>
                        import(
                          "../../pages/api-key-management/[id]/sales-channels"
                        ),
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
              },
              children: [
                {
                  path: "",
                  element: <Outlet />,
                  children: [
                    {
                      path: "",
                      lazy: () =>
                        import(
                          "../../pages/api-key-management"
                        ),
                      children: [
                        {
                          path: "create",
                          lazy: () =>
                            import(
                              "../../pages/api-key-management/create"
                            ),
                        },
                      ],
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/api-key-management/[id]"
                    );

                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (
                          match: UIMatch<HttpTypes.AdminApiKeyResponse>,
                        ) => <Breadcrumb {...match} />,
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () =>
                        import(
                          "../../pages/api-key-management/[id]/edit"
                        ),
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
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/tax-regions"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("../../pages/tax-regions/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "../../pages/tax-regions/[id]"
                    );

                    return {
                      Component: Outlet,
                      loader,
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
                      lazy: () => import("../../pages/tax-regions/[id]"),
                      children: [
                        {
                          path: "edit",
                          lazy: () =>
                            import("../../pages/tax-regions/[id]/edit"),
                        },
                        {
                          path: "provinces/create",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/[id]/provinces/create"
                            ),
                        },
                        {
                          path: "overrides/create",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/[id]/overrides/create"
                            ),
                        },
                        {
                          path: "overrides/:tax_rate_id/edit",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/[id]/overrides/[tax_rate_id]/edit"
                            ),
                        },
                        {
                          path: "tax-rates/create",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/[id]/tax-rates/create"
                            ),
                        },
                        {
                          path: "tax-rates/:tax_rate_id/edit",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/[id]/tax-rates/[tax_rate_id]/edit"
                            ),
                        },
                        {
                          path: "metadata/edit",
                          lazy: () =>
                            import("../../pages/tax-regions/[id]/metadata/edit"),
                        },
                      ],
                    },
                    {
                      path: "provinces/:province_id",
                      lazy: async () => {
                        const { Component, Breadcrumb, loader } = await import(
                          "../../pages/tax-regions/[id]/provinces/[province_id]"
                        );

                        return {
                          Component,
                          loader,
                          handle: {
                            breadcrumb: (
                              match: UIMatch<HttpTypes.AdminTaxRegionResponse>,
                            ) => <Breadcrumb {...match} />,
                          },
                        };
                      },
                      children: [
                        {
                          path: "tax-rates/create",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/[id]/provinces/[province_id]/tax-rates/create"
                            ),
                        },
                        {
                          path: "tax-rates/:tax_rate_id/edit",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/[id]/provinces/[province_id]/tax-rates/[tax_rate_id]/edit"
                            ),
                        },
                        {
                          path: "overrides/create",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/[id]/provinces/[province_id]/overrides/create"
                            ),
                        },
                        {
                          path: "overrides/:tax_rate_id/edit",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/[id]/provinces/[province_id]/overrides/[tax_rate_id]/edit"
                            ),
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
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/return-reasons"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/return-reasons/create"),
                    },
                    {
                      path: ":id",
                      children: [
                        {
                          path: "edit",
                          lazy: () =>
                            import("../../pages/return-reasons/[id]/edit"),
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
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/refund-reasons"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/refund-reasons/create"),
                    },
                    {
                      path: ":id",
                      children: [
                        {
                          path: "edit",
                          lazy: () =>
                            import("../../pages/refund-reasons/[id]/edit"),
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
              handle: {
                breadcrumb: () => t("attributes.domain"),
              },
              children: [
                {
                  path: "",
                  lazy: () => import("../../pages/attributes"),
                  children: [],
                },
                {
                  path: "create",
                  lazy: () => import("../../pages/attributes/create"),
                },
                {
                  path: ":id",
                  children: [
                    {
                      path: "",
                      lazy: () => import("../../pages/attributes/[id]"),
                    },
                    {
                      path: "edit",
                      lazy: () => import("../../pages/attributes/[id]/edit"),
                    },
                    {
                      path: "possible-values",
                      lazy: () =>
                        import("../../pages/attributes/[id]/possible-values"),
                    },
                  ],
                },
              ],
            },
            ...(settingsRoutes?.[0]?.children || []),
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
              lazy: () => import("../../pages/login"),
            },
            {
              path: "/reset-password",
              lazy: () => import("../../pages/reset-password"),
            },
            {
              path: "/invite",
              lazy: () => import("../../pages/invite"),
            },
            {
              path: "*",
              lazy: () => import("../../pages/no-match"),
            },
          ],
        },
      ],
    },
  ];
}
