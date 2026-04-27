import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { TooltipProvider } from './components/ui/tooltip'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
