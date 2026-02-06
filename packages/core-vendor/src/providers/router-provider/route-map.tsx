import { RouteObject } from "react-router-dom"

import { ProtectedRoute } from "@components/authentication/protected-route"
import { MainLayout } from "@components/layout/main-layout"
import { PublicLayout } from "@components/layout/public-layout"
import { SettingsLayout } from "@components/layout/settings-layout"
import { ErrorBoundary } from "@components/utilities/error-boundary"

import { mainRoutes } from "./main-routes"
import { settingsRoutes } from "./settings-routes"
import { publicRoutes } from "./public-routes"

export const RouteMap: RouteObject[] = [
  // PROTECTED - MAIN LAYOUT
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <MainLayout />,
        children: mainRoutes,
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
        children: settingsRoutes,
      },
    ],
  },

  // PUBLIC LAYOUT
  {
    element: <PublicLayout />,
    children: [
      {
        errorElement: <ErrorBoundary />,
        children: publicRoutes,
      },
    ],
  },
]
