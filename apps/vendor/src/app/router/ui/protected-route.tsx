import { useSeller } from '@/entities/seller'
import { PropsWithChildren } from 'react'
import { Redirect, Route, RouteProps } from 'wouter'

export const ProtectedRoute = ({
  children,
  ...props
}: PropsWithChildren<RouteProps>) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
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
