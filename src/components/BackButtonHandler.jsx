import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'

/**
 * Handles Android hardware back button when running in Capacitor.
 * Navigates back in React Router history; exits app when at root.
 */
export default function BackButtonHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let listener

    const setupListener = async () => {
      const { App } = await import('@capacitor/app')
      listener = await App.addListener('backButton', () => {
        if (window.location.pathname === '/' || window.location.pathname === '') {
          App.exitApp()
        } else {
          navigate(-1)
        }
      })
    }

    setupListener()

    return () => {
      listener?.remove?.()
    }
  }, [navigate])

  return null
}
