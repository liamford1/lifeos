'use client'

import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Button from '@/components/Button'
import FormInput from '@/components/FormInput'
import FormField from '@/components/FormField'
import { z } from 'zod'
import { useFormValidation } from '@/lib/hooks/useFormValidation'

// Zod schema for auth form validation
const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState('')

  const handleAuthSubmit = async (formData) => {
    setMessage('')
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: formData.email, 
          password: formData.password 
        })
        if (error) {
          setMessage(error.message)
        } else {
          router.push('/') // ✅ Redirect to home on successful login
        }
      } else {
        const { error } = await supabase.auth.signUp({ 
          email: formData.email, 
          password: formData.password 
        })
        setMessage(error ? error.message : 'Check your email to confirm signup!')
      }
    } catch (error) {
      setMessage(error.message || 'An error occurred')
    }
  };

  const {
    fieldErrors,
    isSubmitting,
    handleSubmit,
    getFieldError,
  } = useFormValidation(authSchema, handleAuthSubmit);

  const onSubmitHandler = (e) => {
    const formData = { email, password };
    handleSubmit(e, formData);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">{isLogin ? 'Login' : 'Sign Up'}</h1>

      <form onSubmit={onSubmitHandler} className="w-64 space-y-4">
        <FormField 
          label="Email" 
          error={getFieldError('email')}
          required
        >
          <FormInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={isSubmitting}
            data-testid="auth-email"
          />
        </FormField>

        <FormField 
          label="Password" 
          error={getFieldError('password')}
          required
        >
          <FormInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            disabled={isSubmitting}
            data-testid="auth-password"
          />
        </FormField>

        {message && (
          <div className="text-red-400 text-sm text-center" role="alert">
            {message}
          </div>
        )}

        <Button
          onClick={onSubmitHandler}
          variant="primary"
          className="w-full"
          disabled={isSubmitting}
          data-testid="auth-submit"
        >
          {isSubmitting ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
        </Button>
      </form>

      <Button
        onClick={() => setIsLogin(!isLogin)}
        variant="link"
        size="sm"
        className="mt-4"
        disabled={isSubmitting}
      >
        {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
      </Button>
    </div>
  )
}
