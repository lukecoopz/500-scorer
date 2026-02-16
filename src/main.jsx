import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from '@/App.jsx'
import '@/index.css'

// Set status bar style for Capacitor (light icons on dark background)
if (Capacitor.isNativePlatform()) {
  import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
    StatusBar.setStyle({ style: Style.Dark })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
