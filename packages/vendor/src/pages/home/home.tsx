import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { usePermissions } from "@mercurjs/dashboard-shared"

import { useLandingRoute } from "../../components/layout/main-layout/main-layout"

export const Home = () => {
  const navigate = useNavigate()
  const { isLoading } = usePermissions()
  const landing = useLandingRoute()

  useEffect(() => {
    if (isLoading) {
      return
    }
    navigate(landing, { replace: true })
  }, [navigate, landing, isLoading])

  return <div />
}
