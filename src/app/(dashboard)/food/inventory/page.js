'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Button from '@/components/Button';
import BackButton from '@/components/BackButton'

export default function InventoryPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  const [items, setItems] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [subtractAmounts, setSubtractAmounts] = useState({})

  const fetchInventory = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('Not logged in')
      return
    }

    const { data, error } = await supabase
      .from('food_items')
      .select(`
        id,
        name,
        quantity,
        unit,
        added_from,
        added_at,
        receipt_id,
        receipts (
          store_name,
          scanned_at
        )
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Error fetching inventory:', error)
    } else {
      setItems(data)
    }

    setInventoryLoading(false)
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const handleDelete = async (id) => {
    const { error } = await supabase.from('food_items').delete().eq('id', id)
    if (error) {
      console.error('Delete error:', error)
    } else {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const handleSubtract = async (id) => {
    const amount = parseFloat(subtractAmounts[id])
    if (isNaN(amount) || amount <= 0) return

    const item = items.find((i) => i.id === id)
    if (!item) return

    const newQty = parseFloat(item.quantity) - amount

    if (newQty <= 0) {
      await handleDelete(id)
    } else {
      const { error } = await supabase
        .from('food_items')
        .update({ quantity: newQty })
        .eq('id', id)

      if (error) {
        console.error('Update error:', error)
      } else {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
        )
      }
    }

    setSubtractAmounts((prev) => ({ ...prev, [id]: '' }))
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">🥫 Your Pantry</h1>
      <p className="text-gray-400">Track your food inventory and pantry items.</p>

      {inventoryLoading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No entries yet. Add one above ⬆️</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="bg-gray-800 rounded p-4 shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-300">
                    {item.quantity} {item.unit}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Added from: {item.added_from}
                    {item.receipts?.store_name && (
                      <> (Receipt: {item.receipts.store_name})</>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Added on: {new Date(item.added_at).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  onClick={() => handleDelete(item.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 text-xl font-bold ml-4 p-0"
                  title="Delete"
                >
                  ✕
                </Button>
              </div>

              <div className="mt-4 flex gap-2 items-center">
                <input
                  className="bg-gray-700 text-white px-2 py-1 rounded w-24"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Amount"
                  value={subtractAmounts[item.id] || ''}
                  onChange={(e) =>
                    setSubtractAmounts((prev) => ({
                      ...prev,
                      [item.id]: e.target.value,
                    }))
                  }
                />
                <span className="text-sm text-gray-300">{item.unit}</span>
                <Button
                  onClick={() => handleSubtract(item.id)}
                  variant="secondary"
                  size="sm"
                  className="text-sm"
                >
                  Subtract
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
