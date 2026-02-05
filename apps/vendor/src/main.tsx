import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mercurjs/dashboard-sdk/index.css'
import App from '@mercurjs/dashboard-sdk'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
