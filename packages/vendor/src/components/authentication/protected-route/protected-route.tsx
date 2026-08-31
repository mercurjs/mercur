import { Spinner } from "@medusajs/icons";
import { PermissionsProvider } from "@mercurjs/dashboard-shared";
import type { Permission, UserPolicy } from "@mercurjs/dashboard-sdk";
import { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useFeatureFlags } from "../../../hooks/api/feature-flags";
import { useMe } from "../../../hooks/api/members";
import { useMePermissions } from "../../../hooks/api/rbac";
import { SearchProvider } from "../../../providers/search-provider";
import { SidebarProvider } from "../../../providers/sidebar-provider";

export const ProtectedRoute = () => {
  const { seller_member, isLoading } = useMe();
  const location = useLocation();

  const { feature_flags } = useFeatureFlags();
  const isRbacEnabled = !!feature_flags?.rbac;

  const { data: permissionsResponse, isLoading: isLoadingPermissions } =
    useMePermissions({
      // Don't fetch until a seller is resolved — the endpoint reads the role
      // from the membership the `x-seller-id` header selects.
      enabled: !!seller_member && isRbacEnabled,
    });

  const policy: UserPolicy | null = useMemo(() => {
    if (!permissionsResponse) {
      return null;
    }

    return {
      permissions: permissionsResponse.permissions as Permission[],
    };
  }, [permissionsResponse]);

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
      policy={policy}
      isLoading={isLoadingPermissions}
      isRbacEnabled={isRbacEnabled}
    >
      <SidebarProvider>
        <SearchProvider>
          <Outlet />
        </SearchProvider>
      </SidebarProvider>
    </PermissionsProvider>
  );
};
