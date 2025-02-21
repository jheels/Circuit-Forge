import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'
import './index.css'
import { DndProviderWrapper } from './context/DndContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DndProviderWrapper>
      <App />
    </DndProviderWrapper>
  </StrictMode>,
)
