'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function FoodTestPage() {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const loadUserAndFoods = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log('Not logged in')
        return
      }

      setUserId(user.id)

      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false })

      if (error) {
        console.error('Error fetching foods:', error)
      } else {
        setFoods(data)
      }

      setLoading(false)
    }

    loadUserAndFoods()
  }, [])

  const handleAddFood = async () => {
    if (!name || !quantity || !unit || !userId) return

    const { error } = await supabase.from('food_items').insert([
      {
        user_id: userId,
        name,
        quantity: parseFloat(quantity),
        unit,
      },
    ])

    if (error) {
      console.error('Insert error:', error)
    } else {
      setName('')
      setQuantity('')
      setUnit('')
      // Refresh list
      const { data } = await supabase
        .from('food_items')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false })
      setFoods(data)
    }
  }

  if (loading) return <p className="p-4">Loading...</p>

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Your Food Items</h1>

      <div className="mb-6 space-y-2">
        <input
          className="border p-2 rounded w-full"
          placeholder="Name (e.g. Eggs)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border p-2 rounded w-full"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <input
          className="border p-2 rounded w-full"
          placeholder="Unit (e.g. pieces)"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
        <button
          onClick={handleAddFood}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Food
        </button>
      </div>

      {foods.length === 0 ? (
        <p>No food items found.</p>
      ) : (
        <ul className="space-y-2">
          {foods.map((item) => (
            <li key={item.id} className="bg-gray-100 p-3 rounded">
              {item.name} — {item.quantity} {item.unit}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
