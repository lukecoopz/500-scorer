import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'

/**
 * Handles Android hardware back button when running in Capacitor.
 * Closes any open Radix dialog first; otherwise navigates back in
 * React Router history, exiting the app when at root.
 */
export default function BackButtonHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let listener

    const setupListener = async () => {
      const { App } = await import('@capacitor/app')
      listener = await App.addListener('backButton', () => {
        const openDialog = document.querySelector('[role="dialog"]')
        if (openDialog) {
          openDialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
          return
        }
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
