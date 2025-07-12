'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AppBar from '@/components/AppBar'
import BackButton from '@/components/BackButton'

export default function AddReceiptPage() {
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
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <AppBar />

      <main className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 p-6 overflow-auto">
          <nav className="flex flex-col gap-4">
            <a href="/food" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">🍽️ Food / Diet</a>
            <a href="/fitness" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">🏋️ Fitness</a>
            <a href="/finances" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">💸 Finances</a>
            <a href="/scratchpad" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">🧠 Scratchpad</a>
          </nav>
        </aside>

        {/* Content */}
        <section className="flex-grow p-8 overflow-auto">
          <BackButton />
          <h1 className="text-2xl font-bold mb-6">🧾 Add a Receipt</h1>

          <input
            className="bg-gray-700 p-2 rounded w-full mb-6"
            placeholder="Store name (e.g. Safeway)"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />

          <div className="grid grid-cols-4 gap-3 mb-4">
            <input
              className="bg-gray-700 p-2 rounded"
              placeholder="Item name"
              value={currentItem.name}
              onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
            />
            <input
              className="bg-gray-700 p-2 rounded"
              placeholder="Qty"
              value={currentItem.quantity}
              onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
            />
            <input
              className="bg-gray-700 p-2 rounded"
              placeholder="Unit"
              value={currentItem.unit}
              onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
            />
            <input
              className="bg-gray-700 p-2 rounded"
              placeholder="Price"
              value={currentItem.price}
              onChange={(e) => setCurrentItem({ ...currentItem, price: e.target.value })}
            />
          </div>

          <button
            onClick={handleAddItem}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
          >
            + Add Item
          </button>

          {items.length > 0 && (
            <ul className="mb-6 space-y-2">
              {items.map((item, index) => (
                <li key={index} className="bg-gray-700 p-3 rounded shadow">
                  <span className="font-semibold">{item.name}</span> — {item.quantity} {item.unit}
                  {item.price && <span className="text-gray-300"> (${item.price})</span>}
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Submit Receipt
          </button>

          {message && (
            <p className="mt-4 text-sm text-green-400">
              {message}
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
