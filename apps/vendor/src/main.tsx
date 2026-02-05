import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mercurjs/core-ui/index.css'
import {App} from '@mercurjs/core-ui'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
