/**
 * PUBLIC ROUTES - Agent B
 *
 * Odpowiedzialność Agent B (Public):
 * - login/
 * - register/
 * - reset-password/
 * - invite/
 * - no-match/ (404)
 *
 * Instrukcje:
 * 1. Dla każdego modułu zamień relative imports na aliasy (@pages/, @components/, etc.)
 * 2. Dodaj route tutaj po migracji każdego modułu
 * 3. NIE edytuj main-routes.tsx
 */

import { RouteObject } from "react-router-dom"

export const publicRoutes: RouteObject[] = [
  {
    path: "/login",
    lazy: () => import("@pages/login"),
  },
  {
    path: "/register",
    lazy: () => import("@pages/register"),
  },
  {
    path: "/reset-password",
    lazy: () => import("@pages/reset-password"),
  },
  {
    path: "/invite",
    lazy: () => import("@pages/invite"),
  },
  {
    path: "*",
    lazy: () => import("@pages/no-match"),
  },
]
