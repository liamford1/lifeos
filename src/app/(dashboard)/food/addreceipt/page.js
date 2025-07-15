'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import BackButton from '@/components/BackButton'
import Button from '@/components/Button'

export default function AddReceiptPage(props) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  const [storeName, setStoreName] = useState('')
  const [items, setItems] = useState([])
  const [currentItem, setCurrentItem] = useState({ name: '', quantity: '', unit: '', price: '' })
  const [message, setMessage] = useState('')

  const handleAddItem = () => {
    if (!currentItem.name || !currentItem.quantity || !currentItem.unit) return
    setItems([...items, currentItem])
    setCurrentItem({ name: '', quantity: '', unit: '', price: '' })
  }

  const handleSubmit = async () => {
    if (!storeName || items.length === 0) {
      setMessage('Please enter a store name and at least one item.')
      return
    }

    const user = await supabase.auth.getUser()
    const userId = user?.data?.user?.id

    if (!userId) {
      setMessage('You must be logged in to submit a receipt.')
      return
    }

    const { data: receiptData, error: receiptError } = await supabase
      .from('receipts')
      .insert([{ user_id: userId, store_name: storeName }])
      .select()
      .single()

    if (receiptError) {
      console.error('Error inserting receipt:', receiptError)
      setMessage('Error creating receipt.')
      return
    }

    const receiptId = receiptData.id

    const receiptItems = items.map(item => ({
      receipt_id: receiptId,
      name: item.name,
      quantity: parseFloat(item.quantity),
      unit: item.unit,
      price: item.price ? parseFloat(item.price) : null
    }))

    const { error: itemError } = await supabase
      .from('receipt_items')
      .insert(receiptItems)

    if (itemError) {
      console.error('Error inserting receipt items:', itemError)
      setMessage('Error adding items to receipt.')
      return
    }

    const foodItems = items.map(item => ({
      user_id: userId,
      name: item.name,
      quantity: parseFloat(item.quantity),
      unit: item.unit,
      added_from: 'receipt',
      receipt_id: receiptId
    }))

    const { error: foodError } = await supabase
      .from('food_items')
      .insert(foodItems)

    if (foodError) {
      console.error('Error syncing to food_items:', foodError)
      setMessage('Receipt saved, but failed to update inventory.')
      return
    }

    setStoreName('')
    setItems([])
    setMessage('✅ Receipt and items saved!')
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">🧾 Add a Receipt</h1>
      <p className="text-base">Add items from a receipt to your pantry inventory.</p>

      <input
        className="bg-surface p-2 rounded w-full mb-6"
        placeholder="Store name (e.g. Safeway)"
        value={storeName}
        onChange={(e) => setStoreName(e.target.value)}
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <input
          className="bg-surface p-2 rounded"
          placeholder="Item name"
          value={currentItem.name}
          onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
        />
        <input
          className="bg-surface p-2 rounded"
          placeholder="Qty"
          value={currentItem.quantity}
          onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
        />
        <input
          className="bg-surface p-2 rounded"
          placeholder="Unit"
          value={currentItem.unit}
          onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
        />
        <input
          className="bg-surface p-2 rounded"
          placeholder="Price"
          value={currentItem.price}
          onChange={(e) => setCurrentItem({ ...currentItem, price: e.target.value })}
        />
      </div>

      <Button
        onClick={handleAddItem}
        variant="primary"
        className="mb-6"
      >
        + Add Item
      </Button>

      {items.length > 0 && (
        <ul className="mb-6 space-y-2">
          {items.map((item, index) => (
            <li key={index} className="bg-surface p-3 rounded shadow">
              <span className="font-semibold">{item.name}</span> — {item.quantity} {item.unit}
              {item.price && <span className="text-base"> (${item.price})</span>}
            </li>
          ))}
        </ul>
      )}

      <Button
        onClick={handleSubmit}
        variant="success"
      >
        Submit Receipt
      </Button>

      {message && (
        <p className="mt-4 text-sm text-green-400">
          {message}
        </p>
      )}
    </div>
  )
}
