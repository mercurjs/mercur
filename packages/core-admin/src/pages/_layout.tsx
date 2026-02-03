/**
 * Root Layout - Protected routes with MainLayout
 *
 * This layout wraps all authenticated routes and provides:
 * - Authentication check (redirects to /login if not authenticated)
 * - SidebarProvider and SearchProvider contexts
 * - MainLayout with navigation sidebar
 *
 * Used by file-based routing system.
 * User can override this file to customize the main layout.
 */
import { ProtectedRoute } from "@components/authentication/protected-route"
import { MainLayout } from "@components/layout/main-layout"
import { Outlet } from "react-router-dom"

/**
 * Root layout component for authenticated routes.
 * Combines ProtectedRoute (auth check) with MainLayout (sidebar + shell).
 */
export default function RootLayout() {
  // ProtectedRoute handles auth and renders Outlet inside providers
  // MainLayout renders Shell which also has Outlet for page content
  // This component is used by file-based routing to wrap authenticated routes
  return <ProtectedRoute />
}

/**
 * For file-based routing, export Component for direct use
 */
export const Component = RootLayout
