'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Button from '@/components/Button'

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState('')

  const handleAuth = async () => {
    setMessage('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        router.push('/') // ✅ Redirect to home on successful login
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      setMessage(error ? error.message : 'Check your email to confirm signup!')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">{isLogin ? 'Login' : 'Sign Up'}</h1>

      <input
        className="border p-2 rounded mb-2 w-64"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2 rounded mb-4 w-64"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        onClick={handleAuth}
        variant="primary"
        className="w-64"
      >
        {isLogin ? 'Log In' : 'Sign Up'}
      </Button>

      <Button
        onClick={() => setIsLogin(!isLogin)}
        variant="link"
        size="sm"
        className="mt-4"
      >
        {isLogin ? 'Need to create an account?' : 'Already have an account?'}
      </Button>

      {message && <p className="mt-4 text-sm text-base">{message}</p>}
    </div>
  )
}
