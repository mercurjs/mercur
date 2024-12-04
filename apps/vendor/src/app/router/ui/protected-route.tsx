import { PropsWithChildren, useEffect, useState } from 'react'
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAuthenticated(false)
      setIsLoading(false)
    }, 1000)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  return { isAuthenticated, isLoading }
}
