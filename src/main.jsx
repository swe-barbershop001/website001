import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@material-tailwind/react'
import './index.css'
import App from './App.jsx'
import AOS from 'aos'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'

function AppWithAOS() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out-cubic',
      once: true,
      mirror: false,
      offset: 100,
    })
    
    // Refresh AOS on route changes
    return () => {
      AOS.refresh()
    }
  }, [])

  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <AppWithAOS />
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
