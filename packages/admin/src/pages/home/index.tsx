import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

const Home = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate("/orders", { replace: true })
  }, [navigate])

  return <div />
}

export const Component = Home;
