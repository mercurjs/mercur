import { Spinner } from "@medusajs/icons";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentPermissions } from "../../../hooks/api/permissions";
import { useMe } from "../../../hooks/api/users";
import { PermissionsProvider } from "@mercurjs/dashboard-shared";
import { SearchProvider } from "../../../providers/search-provider";
import { SidebarProvider } from "../../../providers/sidebar-provider";

export const ProtectedRoute = () => {
  const location = useLocation();

  const { user, isLoading: isLoadingUser } = useMe();
  const { data: permissions, isLoading: isLoadingPermissions } =
    useCurrentPermissions({ enabled: !!user });

  if (isLoadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-ui-fg-interactive animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <PermissionsProvider
      permissions={permissions}
      isLoading={isLoadingPermissions}
    >
      <SidebarProvider>
        <SearchProvider>
          <Outlet />
        </SearchProvider>
      </SidebarProvider>
    </PermissionsProvider>
  );
};
