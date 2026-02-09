/**
 * Example: How to use virtual:mercur-routes
 *
 * The mercurApp vite plugin scans src/pages/ and generates routes automatically.
 * This virtual module can be used as an alternative to the manual get-route.map.tsx
 *
 * Currently, the app uses DashboardApp + get-route.map.tsx for routing.
 * In the future, we can migrate to use virtual:mercur-routes for file-based routing.
 */

// Uncomment to use:
// import { routes } from "virtual:mercur-routes"
//
// Example route structure:
// [
//   { path: "/", Component: HomePage },
//   { path: "/products", Component: ProductsPage, Layout: MainLayout },
//   { path: "/products/:id", Component: ProductDetailPage },
//   { path: "/orders", Component: OrdersPage },
//   ...
// ]
//
// Usage with react-router-dom:
// const router = createBrowserRouter(
//   routes.map(route => ({
//     path: route.path,
//     element: route.Layout
//       ? <route.Layout><route.Component /></route.Layout>
//       : <route.Component />,
//     errorElement: route.ErrorBoundary
//       ? <route.ErrorBoundary error={new Error()} />
//       : undefined,
//   }))
// )

export {}
