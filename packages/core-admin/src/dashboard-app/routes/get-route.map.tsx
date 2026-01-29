import type { HttpTypes } from "@medusajs/types";

import { t } from "i18next";
import { Outlet, type RouteObject, type UIMatch } from "react-router-dom";

import { ProtectedRoute } from "@components/authentication/protected-route";
import { MainLayout } from "@components/layout/main-layout";
import { PublicLayout } from "@components/layout/public-layout";
import { SettingsLayout } from "@components/layout/settings-layout";
import { ErrorBoundary } from "@components/utilities/error-boundary";

import { TaxRegionDetailBreadcrumb } from "@pages/tax-regions/tax-region-detail/breadcrumb";
import { taxRegionLoader } from "@pages/tax-regions/tax-region-detail/loader";

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
                              "../../pages/product-variants/product-variant-edit"
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
                          "../../pages/product-variants/product-variant-detail"
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
                              "../../pages/product-variants/product-variant-edit"
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
                              "../../pages/product-variants/product-variant-manage-inventory-items"
                            ),
                        },
                        {
                          path: "metadata/edit",
                          lazy: () =>
                            import(
                              "../../pages/product-variants/product-variant-metadata"
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
                  lazy: () => import("../../pages/categories/category-list"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/categories/category-create"),
                    },
                    {
                      path: "organize",
                      lazy: () =>
                        import("../../pages/categories/category-organize"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/categories/category-detail"
                    );

                    return {
                      Component,
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
                      path: "edit",
                      lazy: () =>
                        import("../../pages/categories/category-edit"),
                    },
                    {
                      path: "products",
                      lazy: () =>
                        import("../../pages/categories/category-products"),
                    },
                    {
                      path: "organize",
                      lazy: () =>
                        import("../../pages/categories/category-organize"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("../../pages/categories/categories-metadata"),
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
                  lazy: () => import("../../pages/orders/order-list"),
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/orders/order-detail"
                    );

                    return {
                      Component,
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
                      path: "fulfillment",
                      lazy: () =>
                        import("../../pages/orders/order-create-fulfillment"),
                    },
                    {
                      path: "returns/:return_id/receive",
                      lazy: () =>
                        import("../../pages/orders/order-receive-return"),
                    },
                    {
                      path: "allocate-items",
                      lazy: () =>
                        import("../../pages/orders/order-allocate-items"),
                    },
                    {
                      path: ":f_id/create-shipment",
                      lazy: () =>
                        import("../../pages/orders/order-create-shipment"),
                    },
                    {
                      path: "returns",
                      lazy: () =>
                        import("../../pages/orders/order-create-return"),
                    },
                    {
                      path: "claims",
                      lazy: () =>
                        import("../../pages/orders/order-create-claim"),
                    },
                    {
                      path: "exchanges",
                      lazy: () =>
                        import("../../pages/orders/order-create-exchange"),
                    },
                    {
                      path: "edits",
                      lazy: () =>
                        import("../../pages/orders/order-create-edit"),
                    },
                    {
                      path: "refund",
                      lazy: () =>
                        import("../../pages/orders/order-create-refund"),
                    },
                    {
                      path: "transfer",
                      lazy: () =>
                        import("../../pages/orders/order-request-transfer"),
                    },
                    {
                      path: "email",
                      lazy: () =>
                        import("../../pages/orders/order-edit-email"),
                    },
                    {
                      path: "shipping-address",
                      lazy: () =>
                        import(
                          "../../pages/orders/order-edit-shipping-address"
                        ),
                    },
                    {
                      path: "billing-address",
                      lazy: () =>
                        import(
                          "../../pages/orders/order-edit-billing-address"
                        ),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () => import("../../pages/orders/order-metadata"),
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
                  lazy: () => import("../../pages/promotions/promotion-list"),
                },
                {
                  path: "create",
                  lazy: () =>
                    import("../../pages/promotions/promotion-create"),
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/promotions/promotion-detail"
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
                          "../../pages/promotions/promotion-edit-details"
                        ),
                    },
                    {
                      path: "add-to-campaign",
                      lazy: () =>
                        import(
                          "../../pages/promotions/promotion-add-campaign"
                        ),
                    },
                    {
                      path: ":ruleType/edit",
                      lazy: () =>
                        import("../../pages/promotions/common/edit-rules"),
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
                  lazy: () => import("../../pages/campaigns/campaign-list"),
                  children: [],
                },
                {
                  path: "create",
                  lazy: () => import("../../pages/campaigns/campaign-create"),
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/campaigns/campaign-detail"
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
                        import("../../pages/campaigns/campaign-edit"),
                    },
                    {
                      path: "configuration",
                      lazy: () =>
                        import("../../pages/campaigns/campaign-configuration"),
                    },
                    {
                      path: "edit-budget",
                      lazy: () =>
                        import("../../pages/campaigns/campaign-budget-edit"),
                    },
                    {
                      path: "add-promotions",
                      lazy: () =>
                        import(
                          "../../pages/campaigns/add-campaign-promotions"
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
                  lazy: () =>
                    import("../../pages/collections/collection-list"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/collections/collection-create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/collections/collection-detail"
                    );

                    return {
                      Component,
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
                      path: "edit",
                      lazy: () =>
                        import("../../pages/collections/collection-edit"),
                    },
                    {
                      path: "products",
                      lazy: () =>
                        import(
                          "../../pages/collections/collection-add-products"
                        ),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("../../pages/collections/collection-metadata"),
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
                  lazy: () =>
                    import("../../pages/price-lists/price-list-list"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/price-lists/price-list-create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/price-lists/price-list-detail"
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
                      lazy: () =>
                        import("../../pages/price-lists/price-list-edit"),
                    },
                    {
                      path: "configuration",
                      lazy: () =>
                        import(
                          "../../pages/price-lists/price-list-configuration"
                        ),
                    },
                    {
                      path: "products/add",
                      lazy: () =>
                        import(
                          "../../pages/price-lists/price-list-prices-add"
                        ),
                    },
                    {
                      path: "products/edit",
                      lazy: () =>
                        import(
                          "../../pages/price-lists/price-list-prices-edit"
                        ),
                    },
                  ],
                },
              ],
            },
            {
              path: "/requests",
              errorElement: <ErrorBoundary />,
              handle: {
                breadcrumb: () => t("requests.domain"),
              },
              children: [
                {
                  path: "seller",
                  handle: {
                    breadcrumb: () => t("requests.seller"),
                  },
                  lazy: () =>
                    import("../../pages/requests/request-seller-list"),
                },
                {
                  path: "review-remove",
                  handle: {
                    breadcrumb: () => t("requests.review-remove"),
                  },
                  lazy: () =>
                    import("../../pages/requests/request-review-remove-list"),
                },
                {
                  path: "product",
                  handle: {
                    breadcrumb: () => t("requests.product"),
                  },
                  children: [
                    {
                      path: "",
                      lazy: () =>
                        import("../../pages/requests/request-product-list"),
                    },
                    {
                      path: ":id",
                      lazy: () =>
                        import("../../pages/requests/request-product-details"),
                    },
                  ],
                },
                {
                  path: "return",
                  handle: {
                    breadcrumb: () => t("requests.return"),
                  },
                  lazy: () =>
                    import("../../pages/requests/request-return-list"),
                },
                {
                  path: "product-collection",
                  handle: {
                    breadcrumb: () => t("requests.product-collection"),
                  },
                  lazy: () =>
                    import(
                      "../../pages/requests/request-product-collection-list"
                    ),
                },
                {
                  path: "product-category",
                  handle: {
                    breadcrumb: () => t("requests.product-category"),
                  },
                  lazy: () =>
                    import(
                      "../../pages/requests/request-product-category-list"
                    ),
                },
                {
                  path: "product-update",
                  handle: {
                    breadcrumb: () => t("requests.product-update"),
                  },
                  lazy: () =>
                    import("../../pages/requests/request-product-update-list"),
                },
                {
                  path: "product-tag",
                  handle: {
                    breadcrumb: () => t("requests.product-tag"),
                  },
                  lazy: () =>
                    import("../../pages/requests/request-product-tag-list"),
                },
                {
                  path: "product-type",
                  handle: {
                    breadcrumb: () => t("requests.product-type"),
                  },
                  lazy: () =>
                    import("../../pages/requests/request-product-type-list"),
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
                  lazy: () => import("../../pages/customers/customer-list"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/customers/customer-create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/customers/customer-detail"
                    );

                    return {
                      Component,
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
                      path: "edit",
                      lazy: () =>
                        import("../../pages/customers/customer-edit"),
                    },
                    {
                      path: "create-address",
                      lazy: () =>
                        import(
                          "../../pages/customers/customer-create-address"
                        ),
                    },
                    {
                      path: "add-customer-groups",
                      lazy: () =>
                        import(
                          "../../pages/customers/customers-add-customer-group"
                        ),
                    },
                    {
                      path: ":order_id/transfer",
                      lazy: () =>
                        import("../../pages/orders/order-request-transfer"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("../../pages/customers/customer-metadata"),
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
                  lazy: () => import("../../pages/sellers/seller-list"),
                },
                {
                  path: ":id",
                  lazy: () => import("../../pages/sellers/seller-details"),
                },
                {
                  path: ":id/edit",
                  lazy: () => import("../../pages/sellers/seller-edit"),
                },
              ],
            },
            {
              path: "/messages",
              errorElement: <ErrorBoundary />,
              handle: {
                breadcrumb: () => t("messages.domain"),
              },
              lazy: () => import("../../pages/messages"),
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
                  lazy: () =>
                    import("../../pages/customer-groups/customer-group-list"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import(
                          "../../pages/customer-groups/customer-group-create"
                        ),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/customer-groups/customer-group-detail"
                    );

                    return {
                      Component,
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
                      path: "edit",
                      lazy: () =>
                        import(
                          "../../pages/customer-groups/customer-group-edit"
                        ),
                    },
                    {
                      path: "add-customers",
                      lazy: () =>
                        import(
                          "../../pages/customer-groups/customer-group-add-customers"
                        ),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import(
                          "../../pages/customer-groups/customer-group-metadata"
                        ),
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
                    import("../../pages/reservations/reservation-list"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/reservations/reservation-create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/reservations/reservation-detail"
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
                          "../../pages/reservations/reservation-detail/components/edit-reservation"
                        ),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import(
                          "../../pages/reservations/reservation-metadata"
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
                  lazy: () => import("../../pages/inventory/inventory-list"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/inventory/inventory-create"),
                    },
                    {
                      path: "stock",
                      lazy: () =>
                        import("../../pages/inventory/inventory-stock"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/inventory/inventory-detail"
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
                      lazy: () =>
                        import(
                          "../../pages/inventory/inventory-detail/components/edit-inventory-item"
                        ),
                    },
                    {
                      path: "attributes",
                      lazy: () =>
                        import(
                          "../../pages/inventory/inventory-detail/components/edit-inventory-item-attributes"
                        ),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("../../pages/inventory/inventory-metadata"),
                    },
                    {
                      path: "locations",
                      lazy: () =>
                        import(
                          "../../pages/inventory/inventory-detail/components/manage-locations"
                        ),
                    },
                    {
                      path: "locations/:location_id",
                      lazy: () =>
                        import(
                          "../../pages/inventory/inventory-detail/components/adjust-inventory"
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
              lazy: () => import("../../pages/profile/profile-detail"),
              handle: {
                breadcrumb: () => t("profile.domain"),
              },
              children: [
                {
                  path: "edit",
                  lazy: () => import("../../pages/profile/profile-edit"),
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
                  lazy: () => import("../../pages/regions/region-list"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("../../pages/regions/region-create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/regions/region-detail"
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
                      lazy: () => import("../../pages/regions/region-edit"),
                    },
                    {
                      path: "countries/add",
                      lazy: () =>
                        import("../../pages/regions/region-add-countries"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("../../pages/regions/region-metadata"),
                    },
                  ],
                },
              ],
            },
            {
              path: "store",
              errorElement: <ErrorBoundary />,
              lazy: () => import("../../pages/store/store-detail"),
              handle: {
                breadcrumb: () => t("store.domain"),
              },
              children: [
                {
                  path: "edit",
                  lazy: () => import("../../pages/store/store-edit"),
                },
                {
                  path: "currencies",
                  lazy: () => import("../../pages/store/store-add-currencies"),
                },
                {
                  path: "metadata/edit",
                  lazy: () => import("../../pages/store/store-metadata"),
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
                  lazy: () => import("../../pages/users/user-list"),
                  children: [
                    {
                      path: "invite",
                      lazy: () => import("../../pages/users/user-invite"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/users/user-detail"
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
                      lazy: () => import("../../pages/users/user-edit"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () => import("../../pages/users/user-metadata"),
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
                    import("../../pages/sales-channels/sales-channel-list"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import(
                          "../../pages/sales-channels/sales-channel-create"
                        ),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/sales-channels/sales-channel-detail"
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
                          "../../pages/sales-channels/sales-channel-edit"
                        ),
                    },
                    {
                      path: "add-products",
                      lazy: () =>
                        import(
                          "../../pages/sales-channels/sales-channel-add-products"
                        ),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import(
                          "../../pages/sales-channels/sales-channel-metadata"
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
                  lazy: () => import("../../pages/locations/location-list"),
                },
                {
                  path: "create",
                  lazy: () => import("../../pages/locations/location-create"),
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
                      lazy: () =>
                        import(
                          "../../pages/shipping-profiles/shipping-profiles-list"
                        ),
                      children: [
                        {
                          path: "create",
                          lazy: () =>
                            import(
                              "../../pages/shipping-profiles/shipping-profile-create"
                            ),
                        },
                      ],
                    },
                    {
                      path: ":shipping_profile_id",
                      lazy: async () => {
                        const { Component, Breadcrumb, loader } = await import(
                          "../../pages/shipping-profiles/shipping-profile-detail"
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
                              "../../pages/shipping-profiles/shipping-profile-metadata"
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
                        import(
                          "../../pages/shipping-option-types/shipping-option-type-list"
                        ),
                      children: [
                        {
                          path: "create",
                          lazy: () =>
                            import(
                              "../../pages/shipping-option-types/shipping-option-type-create"
                            ),
                        },
                      ],
                    },
                    {
                      path: ":id",
                      lazy: async () => {
                        const { Component, Breadcrumb, loader } = await import(
                          "../../pages/shipping-option-types/shipping-option-type-detail"
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
                              "../../pages/shipping-option-types/shipping-option-type-edit"
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
                      "../../pages/locations/location-detail"
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
                        import("../../pages/locations/location-edit"),
                    },
                    {
                      path: "sales-channels",
                      lazy: () =>
                        import(
                          "../../pages/locations/location-sales-channels"
                        ),
                    },
                    {
                      path: "fulfillment-providers",
                      lazy: () =>
                        import(
                          "../../pages/locations/location-fulfillment-providers"
                        ),
                    },
                    {
                      path: "fulfillment-set/:fset_id",
                      children: [
                        {
                          path: "service-zones/create",
                          lazy: () =>
                            import(
                              "../../pages/locations/location-service-zone-create"
                            ),
                        },
                        {
                          path: "service-zone/:zone_id",
                          children: [
                            {
                              path: "edit",
                              lazy: () =>
                                import(
                                  "../../pages/locations/location-service-zone-edit"
                                ),
                            },
                            {
                              path: "areas",
                              lazy: () =>
                                import(
                                  "../../pages/locations/location-service-zone-manage-areas"
                                ),
                            },
                            {
                              path: "shipping-option",
                              children: [
                                {
                                  path: "create",
                                  lazy: () =>
                                    import(
                                      "../../pages/locations/location-service-zone-shipping-option-create"
                                    ),
                                },
                                {
                                  path: ":so_id",
                                  children: [
                                    {
                                      path: "edit",
                                      lazy: () =>
                                        import(
                                          "../../pages/locations/location-service-zone-shipping-option-edit"
                                        ),
                                    },
                                    {
                                      path: "pricing",
                                      lazy: () =>
                                        import(
                                          "../../pages/locations/location-service-zone-shipping-option-pricing"
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
                  lazy: () =>
                    import("../../pages/product-tags/product-tag-list"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/product-tags/product-tag-create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/product-tags/product-tag-detail"
                    );

                    return {
                      Component,
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
                      path: "edit",
                      lazy: () =>
                        import("../../pages/product-tags/product-tag-edit"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import(
                          "../../pages/product-tags/product-tag-metadata"
                        ),
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
                      "../../pages/workflow-executions/workflow-execution-list"
                    ),
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/workflow-executions/workflow-execution-detail"
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
                  lazy: () =>
                    import("../../pages/product-types/product-type-list"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import(
                          "../../pages/product-types/product-type-create"
                        ),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "../../pages/product-types/product-type-detail"
                    );

                    return {
                      Component,
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
                      path: "edit",
                      lazy: () =>
                        import("../../pages/product-types/product-type-edit"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import(
                          "../../pages/product-types/product-type-metadata"
                        ),
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
                          "../../pages/api-key-management/api-key-management-list"
                        ),
                      children: [
                        {
                          path: "create",
                          lazy: () =>
                            import(
                              "../../pages/api-key-management/api-key-management-create"
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
                      "../../pages/api-key-management/api-key-management-detail"
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
                          "../../pages/api-key-management/api-key-management-edit"
                        ),
                    },
                    {
                      path: "sales-channels",
                      lazy: () =>
                        import(
                          "../../pages/api-key-management/api-key-management-sales-channels"
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
                          "../../pages/api-key-management/api-key-management-list"
                        ),
                      children: [
                        {
                          path: "create",
                          lazy: () =>
                            import(
                              "../../pages/api-key-management/api-key-management-create"
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
                      "../../pages/api-key-management/api-key-management-detail"
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
                          "../../pages/api-key-management/api-key-management-edit"
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
                  lazy: () =>
                    import("../../pages/tax-regions/tax-region-list"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("../../pages/tax-regions/tax-region-create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  Component: Outlet,
                  loader: taxRegionLoader,
                  handle: {
                    breadcrumb: (
                      match: UIMatch<HttpTypes.AdminTaxRegionResponse>,
                    ) => <TaxRegionDetailBreadcrumb {...match} />,
                  },
                  children: [
                    {
                      path: "",
                      lazy: async () => {
                        const { Component } = await import(
                          "../../pages/tax-regions/tax-region-detail"
                        );

                        return {
                          Component,
                        };
                      },
                      children: [
                        {
                          path: "edit",
                          lazy: () =>
                            import("../../pages/tax-regions/tax-region-edit"),
                        },
                        {
                          path: "provinces/create",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/tax-region-province-create"
                            ),
                        },
                        {
                          path: "overrides/create",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/tax-region-tax-override-create"
                            ),
                        },
                        {
                          path: "overrides/:tax_rate_id/edit",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/tax-region-tax-override-edit"
                            ),
                        },
                        {
                          path: "tax-rates/create",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/tax-region-tax-rate-create"
                            ),
                        },
                        {
                          path: "tax-rates/:tax_rate_id/edit",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/tax-region-tax-rate-edit"
                            ),
                        },
                        {
                          path: "metadata/edit",
                          lazy: () =>
                            import("../../pages/tax-regions/tax-region-metadata"),
                        },
                      ],
                    },
                    {
                      path: "provinces/:province_id",
                      lazy: async () => {
                        const { Component, Breadcrumb, loader } = await import(
                          "../../pages/tax-regions/tax-region-province-detail"
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
                              "../../pages/tax-regions/tax-region-tax-rate-create"
                            ),
                        },
                        {
                          path: "tax-rates/:tax_rate_id/edit",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/tax-region-tax-rate-edit"
                            ),
                        },
                        {
                          path: "overrides/create",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/tax-region-tax-override-create"
                            ),
                        },
                        {
                          path: "overrides/:tax_rate_id/edit",
                          lazy: () =>
                            import(
                              "../../pages/tax-regions/tax-region-tax-override-edit"
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
                  lazy: () =>
                    import("../../pages/return-reasons/return-reason-list"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import(
                          "../../pages/return-reasons/return-reason-create"
                        ),
                    },

                    {
                      path: ":id",
                      children: [
                        {
                          path: "edit",
                          lazy: () =>
                            import(
                              "../../pages/return-reasons/return-reason-edit"
                            ),
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
                  lazy: () =>
                    import("../../pages/refund-reasons/refund-reason-list"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import(
                          "../../pages/refund-reasons/refund-reason-create"
                        ),
                    },

                    {
                      path: ":id",
                      children: [
                        {
                          path: "edit",
                          lazy: () =>
                            import(
                              "../../pages/refund-reasons/refund-reason-edit"
                            ),
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
                  lazy: () => import("../../pages/attributes/attribute-list"),
                  children: [],
                },
                {
                  path: "create",
                  lazy: () =>
                    import("../../pages/attributes/attribute-create"),
                },
                {
                  path: ":id",
                  children: [
                    {
                      path: "",
                      lazy: () =>
                        import("../../pages/attributes/attribute-detail"),
                    },
                    {
                      path: "edit",
                      lazy: () =>
                        import("../../pages/attributes/attribute-edit"),
                    },
                    {
                      path: "edit-possible-value",
                      lazy: () =>
                        import(
                          "../../pages/attributes/attribute-edit-possible-value"
                        ),
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
