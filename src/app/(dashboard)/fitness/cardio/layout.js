'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function CardioLayout({ children }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth') // Not logged in → redirect to login
      } else {
        setUser(user)
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  if (loading) return <LoadingSpinner />
  return <>{children}</>
}
