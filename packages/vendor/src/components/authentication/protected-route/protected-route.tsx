import { Spinner } from "@medusajs/icons";
import { PermissionsProvider } from "@mercurjs/dashboard-shared";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMe } from "../../../hooks/api/members";
import { useCurrentPermissions } from "../../../hooks/api/permissions";
import { SearchProvider } from "../../../providers/search-provider";
import { SidebarProvider } from "../../../providers/sidebar-provider";

export const ProtectedRoute = () => {
  const { seller_member, isLoading } = useMe();
  const location = useLocation();

  const { data: permissions, isLoading: isLoadingPermissions } =
    useCurrentPermissions(seller_member?.seller_id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-ui-fg-interactive animate-spin" />
      </div>
    );
  }

  if (!seller_member) {
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
