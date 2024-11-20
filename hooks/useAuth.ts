'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const router = useRouter()

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      const checkAuth = async () => {
        const response = await fetch('/api/auth/check')
        if (!response.ok) {
          router.push('/login')
        }
      }
      checkAuth()
    }
  }, [router])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh() // Force a refresh to update the middleware state
  }

  return { logout }
} 