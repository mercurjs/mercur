import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import config from "virtual:mercur/config"

export const Home = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate(config.initialPage ?? "/products", { replace: true })
  }, [navigate])

  return <div />
}
