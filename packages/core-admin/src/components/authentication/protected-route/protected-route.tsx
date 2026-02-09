import { useMe } from "@hooks/api";
import { Spinner } from "@medusajs/icons";
import { SearchProvider } from "@providers/search-provider";
import { SidebarProvider } from "@providers/sidebar-provider";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export const ProtectedRoute = () => {
  const { user, isLoading, error } = useMe();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        data-testid="protected-route-loading"
      >
        <Spinner
          className="animate-spin text-ui-fg-interactive"
          data-testid="protected-route-spinner"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/login${error?.message ? `?reason=${encodeURIComponent(error.message)}` : ""}`}
        state={{ from: location }}
        replace
      />
    );
  }

  return (
    <SidebarProvider>
      <SearchProvider>
        <Outlet />
      </SearchProvider>
    </SidebarProvider>
  );
};
