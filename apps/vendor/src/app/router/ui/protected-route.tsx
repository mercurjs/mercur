import { useSeller } from '@/shared/hooks/api'
import { FallbackLoader } from '@/widgets/fallback-loader'
import { PropsWithChildren } from 'react'
import { Redirect, Route, RouteProps } from 'wouter'

export const ProtectedRoute = ({
  children,
  ...props
}: PropsWithChildren<RouteProps>) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <FallbackLoader />
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />
  }

  return <Route {...props}>{children}</Route>
}

const useAuth = () => {
  const { seller, isLoading } = useSeller()

  return { isAuthenticated: !!seller, isLoading }
}
