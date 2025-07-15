'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Button from '@/components/Button';
import BackButton from '@/components/BackButton'
import { useDeleteEntity } from '@/lib/useSupabaseCrud';
import { Package } from 'lucide-react';
import ManualPantryItemModal from '@/components/ManualPantryItemModal';

export default function InventoryPage() {
  // All hooks at the top!
  const { user, loading } = useUser();
  const router = useRouter();
  const { deleteByFilters, loading: deleteLoading } = useDeleteEntity('food_items');
  const [items, setItems] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [subtractAmounts, setSubtractAmounts] = useState({})
  const [showManualAddModal, setShowManualAddModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  useEffect(() => {
    fetchInventory();
  }, []);

  // fetchInventory must be defined before useEffect, so move it above
  async function fetchInventory() {
    const {
      data: { user },
    } = await import('@/lib/supabaseClient').then(m => m.supabase.auth.getUser())

    if (!user) {
      console.log('Not logged in')
      return
    }

    const { data, error } = await import('@/lib/supabaseClient').then(m => m.supabase.from('food_items').select(`
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
      `).eq('user_id', user.id).order('added_at', { ascending: false }))

    if (error) {
      console.error('Error fetching inventory:', error)
    } else {
      setItems(data)
    }

    setInventoryLoading(false)
  }

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  const handleDelete = async (id) => {
    const { error } = await deleteByFilters({ id });
    if (!error) {
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
      const { error } = await import('@/lib/supabaseClient').then(m => m.supabase.from('food_items').update({ quantity: newQty }).eq('id', id))

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
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold flex items-center">
          <Package className="w-5 h-5 text-base mr-2 inline-block" />
          Your Pantry
        </h1>
        <button
          className="ml-4 px-4 py-2 rounded border border-default bg-card text-base font-medium hover:bg-muted transition-colors"
          onClick={() => setShowManualAddModal(true)}
        >
          + Add Item
        </button>
      </div>
      <p className="text-base">Track your food inventory and pantry items.</p>
      {showManualAddModal && (
        <ManualPantryItemModal 
          onClose={() => setShowManualAddModal(false)}
          onAddSuccess={fetchInventory}
        />
      )}

      {inventoryLoading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No entries yet. Add one above ⬆️</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="bg-surface rounded p-4 shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-semibold">{item.name}</div>
                  <div className="text-sm text-base">
                    {item.quantity} {item.unit}
                  </div>
                  <div className="text-sm text-base mt-1">
                    Added from: {item.added_from}
                    {item.receipts?.store_name && (
                      <> (Receipt: {item.receipts.store_name})</>
                    )}
                  </div>
                  <div className="text-xs text-base mt-1">
                    Added on: {new Date(item.added_at).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  onClick={() => handleDelete(item.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 text-xl font-bold ml-4 p-0"
                  title="Delete"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? <LoadingSpinner size={18} /> : '✕'}
                </Button>
              </div>

              <div className="mt-4 flex gap-2 items-center">
                <input
                  className="bg-surface text-white px-2 py-1 rounded w-24"
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
                <span className="text-sm text-base">{item.unit}</span>
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
