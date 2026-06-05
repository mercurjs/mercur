import { Navigate, Outlet, useLocation } from "react-router-dom";

export const Component = () => {
  const location = useLocation();

  if (location.pathname === "/settings") {
    return <Navigate to="/settings/store" />;
  }

  return <Outlet />;
};
