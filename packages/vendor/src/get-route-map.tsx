import { ComponentType } from "react";
import { t } from "i18next";
import { Outlet, RouteObject, UIMatch } from "react-router-dom";
import { ProtectedRoute } from "./components/authentication/protected-route";
import { MainLayout } from "./components/layout/main-layout";
import { PublicLayout } from "./components/layout/public-layout";
import { SettingsLayout } from "./components/layout/settings-layout";
import { ErrorBoundary } from "./components/utilities/error-boundary";

export type CustomRoute = {
  Component: ComponentType;
  path: string;
  handle?: unknown;
  loader?: unknown;
};

function normalizePath(p: string): string {
  return ("/" + p).replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

function applyOverrides(
  routes: RouteObject[],
  overrides: Map<string, CustomRoute>,
  parentPath: string = ""
): RouteObject[] {
  return routes.map((route) => {
    let fullPath = parentPath;
    if (route.path != null) {
      fullPath = route.path.startsWith("/")
        ? route.path
        : normalizePath(parentPath + "/" + route.path);
    }

    const override = overrides.get(fullPath);

    const updated = override
      ? {
          ...route,
          lazy: undefined,
          Component: override.Component,
          ...(override.handle != null && { handle: override.handle }),
          ...(override.loader != null && { loader: override.loader }),
        }
      : { ...route };

    if (override) {
      overrides.delete(fullPath);
    }

    if (updated.children) {
      updated.children = applyOverrides(updated.children, overrides, fullPath);
    }

    return updated;
  });
}

export function getRouteMap(customRoutes: CustomRoute[] = []): RouteObject[] {
  const overrides = new Map(customRoutes.map((r) => [normalizePath(r.path), r]));

  const routes: RouteObject[] = buildBaseRoutes();

  const result = applyOverrides(routes, overrides);

  // Add remaining custom routes (new pages) under main layout
  if (overrides.size > 0) {
    const mainLayoutChildren =
      result[0]?.children?.[0]?.children;
    if (mainLayoutChildren) {
      for (const [, route] of overrides) {
        mainLayoutChildren.push({
          path: route.path,
          Component: route.Component,
          errorElement: <ErrorBoundary />,
          ...(route.handle != null && { handle: route.handle }),
          ...(route.loader != null && { loader: route.loader }),
        });
      }
    }
  }

  return result;
}

function buildBaseRoutes(): RouteObject[] {
  return [
    // PROTECTED - MAIN LAYOUT
    {
      element: <ProtectedRoute />,
      errorElement: <ErrorBoundary />,
      children: [
        {
          element: <MainLayout />,
          children: [
            // HOME
            {
              path: "/",
              errorElement: <ErrorBoundary />,
              lazy: () => import("./pages/home"),
            },

            // PRODUCTS
            {
              path: "/products",
              errorElement: <ErrorBoundary />,
              handle: { breadcrumb: () => t("products.domain") },
              children: [
                {
                  path: "",
                  lazy: () => import("./pages/products"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("./pages/products/create"),
                    },
                    {
                      path: "import",
                      lazy: () => import("./pages/products/import"),
                    },
                    {
                      path: "export",
                      lazy: () => import("./pages/products/export"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "./pages/products/[id]"
                    );
                    return {
                      Component: Outlet,
                      loader,
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
                      lazy: () => import("./pages/products/[id]"),
                      children: [
                        {
                          path: "edit",
                          lazy: () => import("./pages/products/[id]/edit"),
                        },
                        {
                          path: "sales-channels",
                          lazy: () =>
                            import("./pages/products/[id]/sales-channels"),
                        },
                        {
                          path: "organization",
                          lazy: () =>
                            import("./pages/products/[id]/organization"),
                        },
                        {
                          path: "media",
                          lazy: () => import("./pages/products/[id]/media"),
                        },
                        {
                          path: "attributes",
                          lazy: () =>
                            import("./pages/products/[id]/attributes"),
                        },
                        {
                          path: "additional-attributes",
                          lazy: () =>
                            import(
                              "./pages/products/[id]/additional-attributes"
                            ),
                        },
                        {
                          path: "metadata",
                          lazy: () =>
                            import("./pages/products/[id]/metadata"),
                        },
                        {
                          path: "shipping-profile",
                          lazy: () =>
                            import("./pages/products/[id]/shipping-profile"),
                        },
                        {
                          path: "prices",
                          lazy: () => import("./pages/products/[id]/prices"),
                        },
                        {
                          path: "options/create",
                          lazy: () =>
                            import("./pages/products/[id]/options/create"),
                        },
                        {
                          path: "variants/create",
                          lazy: () =>
                            import("./pages/products/[id]/variants/create"),
                        },
                      ],
                    },
                    {
                      path: "stock",
                      lazy: () => import("./pages/products/[id]/stock"),
                    },
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
                  lazy: () => import("./pages/orders"),
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "./pages/orders/[id]"
                    );
                    return {
                      Component: Outlet,
                      loader,
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
                      lazy: () => import("./pages/orders/[id]"),
                      children: [
                        {
                          path: "fulfillment",
                          lazy: () =>
                            import("./pages/orders/[id]/fulfillment"),
                        },
                        {
                          path: "allocate-items",
                          lazy: () =>
                            import("./pages/orders/[id]/allocate-items"),
                        },
                      ],
                    },
                    {
                      path: "fulfillments/:f_id/shipment",
                      lazy: () => import("./pages/orders/[id]/shipment"),
                    },
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
                  lazy: () => import("./pages/categories"),
                  children: [
                    {
                      path: "organize",
                      lazy: () => import("./pages/categories/organize"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "./pages/categories/[id]"
                    );
                    return {
                      Component: Outlet,
                      loader,
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
                      lazy: () => import("./pages/categories/[id]"),
                      children: [
                        {
                          path: "products",
                          lazy: () =>
                            import("./pages/categories/[id]/products"),
                        },
                        {
                          path: "organize",
                          lazy: () =>
                            import("./pages/categories/[id]/organize"),
                        },
                        {
                          path: "metadata",
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
              handle: { breadcrumb: () => t("collections.domain") },
              children: [
                {
                  path: "",
                  lazy: () => import("./pages/collections"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("./pages/collections/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "./pages/collections/[id]"
                    );
                    return {
                      Component: Outlet,
                      loader,
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
                      lazy: () => import("./pages/collections/[id]"),
                      children: [
                        {
                          path: "add-products",
                          lazy: () =>
                            import("./pages/collections/[id]/add-products"),
                        },
                        {
                          path: "metadata",
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
              handle: { breadcrumb: () => t("customers.domain") },
              children: [
                {
                  path: "",
                  lazy: () => import("./pages/customers"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("./pages/customers/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "./pages/customers/[id]"
                    );
                    return {
                      Component: Outlet,
                      loader,
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
                      lazy: () => import("./pages/customers/[id]"),
                      children: [
                        {
                          path: "edit",
                          lazy: () => import("./pages/customers/[id]/edit"),
                        },
                        {
                          path: "add-customer-groups",
                          lazy: () =>
                            import(
                              "./pages/customers/[id]/add-customer-groups"
                            ),
                        },
                        {
                          path: "metadata",
                          lazy: () =>
                            import("./pages/customers/[id]/metadata"),
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
              handle: { breadcrumb: () => t("customerGroups.domain") },
              children: [
                {
                  path: "",
                  lazy: () => import("./pages/customer-groups"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("./pages/customer-groups/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "./pages/customer-groups/[id]"
                    );
                    return {
                      Component: Outlet,
                      loader,
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
                      lazy: () => import("./pages/customer-groups/[id]"),
                      children: [
                        {
                          path: "edit",
                          lazy: () =>
                            import("./pages/customer-groups/[id]/edit"),
                        },
                        {
                          path: "add-customers",
                          lazy: () =>
                            import(
                              "./pages/customer-groups/[id]/add-customers"
                            ),
                        },
                        {
                          path: "metadata",
                          lazy: () =>
                            import("./pages/customer-groups/[id]/metadata"),
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
              handle: { breadcrumb: () => t("inventory.domain") },
              children: [
                {
                  path: "",
                  lazy: () => import("./pages/inventory"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("./pages/inventory/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "./pages/inventory/[id]"
                    );
                    return {
                      Component: Outlet,
                      loader,
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
                      lazy: () => import("./pages/inventory/[id]"),
                      children: [
                        {
                          path: "edit",
                          lazy: () =>
                            import(
                              "./pages/inventory/[id]/_components/edit-inventory-item"
                            ),
                        },
                        {
                          path: "attributes",
                          lazy: () =>
                            import(
                              "./pages/inventory/[id]/_components/edit-inventory-item-attributes"
                            ),
                        },
                        {
                          path: "stock",
                          lazy: () => import("./pages/inventory/[id]/stock"),
                        },
                        {
                          path: "metadata",
                          lazy: () =>
                            import("./pages/inventory/[id]/metadata"),
                        },
                        {
                          path: "locations",
                          lazy: () =>
                            import(
                              "./pages/inventory/[id]/_components/manage-locations"
                            ),
                        },
                        {
                          path: "locations/:location_id",
                          lazy: () =>
                            import(
                              "./pages/inventory/[id]/_components/adjust-inventory"
                            ),
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
              handle: { breadcrumb: () => t("promotions.domain") },
              children: [
                {
                  path: "",
                  lazy: () => import("./pages/promotions"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("./pages/promotions/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "./pages/promotions/[id]"
                    );
                    return {
                      Component: Outlet,
                      loader,
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
                      lazy: () => import("./pages/promotions/[id]"),
                      children: [
                        {
                          path: "edit",
                          lazy: () => import("./pages/promotions/[id]/edit"),
                        },
                        {
                          path: "add-to-campaign",
                          lazy: () =>
                            import("./pages/promotions/[id]/add-to-campaign"),
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
              handle: { breadcrumb: () => t("campaigns.domain") },
              children: [
                {
                  path: "",
                  lazy: () => import("./pages/campaigns"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("./pages/campaigns/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "./pages/campaigns/[id]"
                    );
                    return {
                      Component: Outlet,
                      loader,
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
                      lazy: () => import("./pages/campaigns/[id]"),
                      children: [
                        {
                          path: "edit",
                          lazy: () => import("./pages/campaigns/[id]/edit"),
                        },
                        {
                          path: "configuration",
                          lazy: () =>
                            import("./pages/campaigns/[id]/configuration"),
                        },
                        {
                          path: "edit-budget",
                          lazy: () =>
                            import("./pages/campaigns/[id]/edit-budget"),
                        },
                        {
                          path: "add-promotions",
                          lazy: () =>
                            import("./pages/campaigns/[id]/add-promotions"),
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
              handle: { breadcrumb: () => t("priceLists.domain") },
              children: [
                {
                  path: "",
                  lazy: () => import("./pages/price-lists"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("./pages/price-lists/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "./pages/price-lists/[id]"
                    );
                    return {
                      Component: Outlet,
                      loader,
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
                      lazy: () => import("./pages/price-lists/[id]"),
                      children: [
                        {
                          path: "edit",
                          lazy: () => import("./pages/price-lists/[id]/edit"),
                        },
                        {
                          path: "configuration",
                          lazy: () =>
                            import("./pages/price-lists/[id]/configuration"),
                        },
                        {
                          path: "products/add",
                          lazy: () =>
                            import("./pages/price-lists/[id]/products/add"),
                        },
                        {
                          path: "products/edit",
                          lazy: () =>
                            import("./pages/price-lists/[id]/products/edit"),
                        },
                        {
                          path: "products/:variant_id/edit",
                          lazy: () =>
                            import(
                              "./pages/price-lists/[id]/products/[variant_id]/edit"
                            ),
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
              handle: { breadcrumb: () => t("reservations.domain") },
              children: [
                {
                  path: "",
                  lazy: () => import("./pages/reservations"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("./pages/reservations/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Breadcrumb, loader } = await import(
                      "./pages/reservations/[id]"
                    );
                    return {
                      Component: Outlet,
                      loader,
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
                          path: "metadata",
                          lazy: () =>
                            import("./pages/reservations/[id]/metadata"),
                        },
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
                const { loader } = await import(
                  "./pages/product-variants/product-variant-detail"
                );
                return {
                  Component: Outlet,
                  loader,
                };
              },
              children: [
                {
                  path: "",
                  lazy: () =>
                    import(
                      "./pages/product-variants/product-variant-detail"
                    ),
                  children: [
                    {
                      path: "edit",
                      lazy: async () => {
                        const { ProductVariantEdit } = await import(
                          "./pages/product-variants/product-variant-edit/product-variant-edit"
                        );
                        return { Component: ProductVariantEdit };
                      },
                    },
                    {
                      path: "prices",
                      lazy: () => import("./pages/products/[id]/prices"),
                    },
                  ],
                },
              ],
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
            // INDEX
            {
              index: true,
              errorElement: <ErrorBoundary />,
              lazy: () => import("./pages/settings"),
            },

            // SELLER
            {
              path: "seller",
              errorElement: <ErrorBoundary />,
              handle: {
                breadcrumb: () => t("seller.domain", "Seller"),
              },
              children: [
                {
                  path: "",
                  lazy: () => import("./pages/settings/seller"),
                  children: [
                    {
                      path: "edit",
                      lazy: () => import("./pages/settings/seller/edit"),
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
                  lazy: () => import("./pages/settings/profile"),
                  children: [
                    {
                      path: "edit",
                      lazy: () => import("./pages/settings/profile/edit"),
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
                  lazy: () => import("./pages/settings/regions"),
                  children: [
                    {
                      path: "create",
                      lazy: () => import("./pages/settings/regions/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "./pages/settings/regions/[id]"
                    );
                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (match: UIMatch<any>) => (
                          <Breadcrumb {...match} />
                        ),
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () =>
                        import("./pages/settings/regions/[id]/edit"),
                    },
                    {
                      path: "countries/add",
                      lazy: () =>
                        import(
                          "./pages/settings/regions/[id]/countries/add"
                        ),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("./pages/settings/regions/[id]/metadata"),
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
                  lazy: () => import("./pages/settings/users"),
                  children: [
                    {
                      path: "invite",
                      lazy: () =>
                        import("./pages/settings/users/invite"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "./pages/settings/users/[id]"
                    );
                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (match: UIMatch<any>) => (
                          <Breadcrumb {...match} />
                        ),
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () =>
                        import("./pages/settings/users/[id]/edit"),
                    },
                    {
                      path: "metadata/edit",
                      lazy: () =>
                        import("./pages/settings/users/[id]/metadata"),
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
                  lazy: () => import("./pages/settings/locations"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("./pages/settings/locations/create"),
                    },
                  ],
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
                        import("./pages/settings/shipping-profiles"),
                      children: [
                        {
                          path: "create",
                          lazy: () =>
                            import(
                              "./pages/settings/shipping-profiles/create"
                            ),
                        },
                      ],
                    },
                    {
                      path: ":shipping_profile_id",
                      lazy: async () => {
                        const { Component, Breadcrumb, loader } =
                          await import(
                            "./pages/settings/shipping-profiles/[id]"
                          );
                        return {
                          Component,
                          loader,
                          handle: {
                            breadcrumb: (match: UIMatch<any>) => (
                              <Breadcrumb {...match} />
                            ),
                          },
                        };
                      },
                      children: [
                        {
                          path: "metadata/edit",
                          lazy: () =>
                            import(
                              "./pages/settings/shipping-profiles/[id]/metadata"
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
                      "./pages/settings/locations/[location_id]"
                    );
                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (match: UIMatch<any>) => (
                          <Breadcrumb {...match} />
                        ),
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () =>
                        import(
                          "./pages/settings/locations/[location_id]/edit"
                        ),
                    },
                    {
                      path: "sales-channels",
                      lazy: () =>
                        import(
                          "./pages/settings/locations/[location_id]/sales-channels"
                        ),
                    },
                    {
                      path: "fulfillment-providers",
                      lazy: () =>
                        import(
                          "./pages/settings/locations/[location_id]/fulfillment-providers"
                        ),
                    },
                    {
                      path: "fulfillment-set/:fset_id/service-zones/create",
                      lazy: () =>
                        import(
                          "./pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zones/create"
                        ),
                    },
                    {
                      path: "fulfillment-set/:fset_id/service-zone/:zone_id/edit",
                      lazy: () =>
                        import(
                          "./pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/edit"
                        ),
                    },
                    {
                      path: "fulfillment-set/:fset_id/service-zone/:zone_id/areas",
                      lazy: () =>
                        import(
                          "./pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/areas"
                        ),
                    },
                    {
                      path: "fulfillment-set/:fset_id/service-zone/:zone_id/shipping-option/create",
                      lazy: () =>
                        import(
                          "./pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/shipping-option/create"
                        ),
                    },
                    {
                      path: "fulfillment-set/:fset_id/service-zone/:zone_id/shipping-option/:so_id/edit",
                      lazy: () =>
                        import(
                          "./pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/shipping-option/[so_id]/edit"
                        ),
                    },
                    {
                      path: "fulfillment-set/:fset_id/service-zone/:zone_id/shipping-option/:so_id/pricing",
                      lazy: () =>
                        import(
                          "./pages/settings/locations/[location_id]/fulfillment-set/[fset_id]/service-zone/[zone_id]/shipping-option/[so_id]/pricing"
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
                  lazy: () => import("./pages/settings/tax-regions"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("./pages/settings/tax-regions/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "./pages/settings/tax-regions/[id]"
                    );
                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (match: UIMatch<any>) => (
                          <Breadcrumb {...match} />
                        ),
                      },
                    };
                  },
                  children: [
                    {
                      path: "tax-rates/create",
                      lazy: () =>
                        import(
                          "./pages/settings/tax-regions/[id]/tax-rates/create"
                        ),
                    },
                    {
                      path: "tax-rates/:tax_rate_id/edit",
                      lazy: () =>
                        import(
                          "./pages/settings/tax-regions/[id]/tax-rates/[tax_rate_id]/edit"
                        ),
                    },
                    {
                      path: "tax-overrides/create",
                      lazy: () =>
                        import(
                          "./pages/settings/tax-regions/[id]/tax-overrides/create"
                        ),
                    },
                    {
                      path: "tax-overrides/:tax_rate_id/edit",
                      lazy: () =>
                        import(
                          "./pages/settings/tax-regions/[id]/tax-overrides/[tax_rate_id]/edit"
                        ),
                    },
                    {
                      path: "provinces/create",
                      lazy: () =>
                        import(
                          "./pages/settings/tax-regions/[id]/provinces/create"
                        ),
                    },
                    {
                      path: "provinces/:province_id",
                      lazy: async () => {
                        const { Component, Breadcrumb, loader } =
                          await import(
                            "./pages/settings/tax-regions/[id]/provinces/[province_id]"
                          );
                        return {
                          Component,
                          loader,
                          handle: {
                            breadcrumb: (match: UIMatch<any>) => (
                              <Breadcrumb {...match} />
                            ),
                          },
                        };
                      },
                      children: [
                        {
                          path: "tax-rates/create",
                          lazy: () =>
                            import(
                              "./pages/settings/tax-regions/[id]/tax-rates/create"
                            ),
                        },
                        {
                          path: "tax-rates/:tax_rate_id/edit",
                          lazy: () =>
                            import(
                              "./pages/settings/tax-regions/[id]/tax-rates/[tax_rate_id]/edit"
                            ),
                        },
                        {
                          path: "tax-overrides/create",
                          lazy: () =>
                            import(
                              "./pages/settings/tax-regions/[id]/tax-overrides/create"
                            ),
                        },
                        {
                          path: "tax-overrides/:tax_rate_id/edit",
                          lazy: () =>
                            import(
                              "./pages/settings/tax-regions/[id]/tax-overrides/[tax_rate_id]/edit"
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
                  lazy: () => import("./pages/settings/product-tags"),
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "./pages/settings/product-tags/[id]"
                    );
                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (match: UIMatch<any>) => (
                          <Breadcrumb {...match} />
                        ),
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () =>
                        import("./pages/settings/product-tags/[id]/edit"),
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
                  lazy: () => import("./pages/settings/product-types"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("./pages/settings/product-types/create"),
                    },
                  ],
                },
                {
                  path: ":id",
                  lazy: async () => {
                    const { Component, Breadcrumb, loader } = await import(
                      "./pages/settings/product-types/[id]"
                    );
                    return {
                      Component,
                      loader,
                      handle: {
                        breadcrumb: (match: UIMatch<any>) => (
                          <Breadcrumb {...match} />
                        ),
                      },
                    };
                  },
                  children: [
                    {
                      path: "edit",
                      lazy: () =>
                        import("./pages/settings/product-types/[id]/edit"),
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
                  lazy: () => import("./pages/settings/return-reasons"),
                  children: [
                    {
                      path: "create",
                      lazy: () =>
                        import("./pages/settings/return-reasons/create"),
                    },
                    {
                      path: ":id/edit",
                      lazy: () =>
                        import(
                          "./pages/settings/return-reasons/[id]/edit"
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

    // PUBLIC LAYOUT
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
              path: "/register",
              lazy: () => import("./pages/register"),
            },
            {
              path: "/reset-password",
              lazy: () => import("./pages/reset-password"),
            },
            {
              path: "/invite",
              lazy: () => import("./pages/invite"),
            },
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
