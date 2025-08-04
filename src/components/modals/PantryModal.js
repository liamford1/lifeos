"use client";

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Button from '@/components/shared/Button';
import { useDeleteEntity } from '@/lib/hooks/useSupabaseCrud';
import dynamic from "next/dynamic";
const Package = dynamic(() => import("lucide-react/dist/esm/icons/package"), { ssr: false });
import ManualPantryItemModal from '@/components/forms/ManualPantryItemModal';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { MdClose } from 'react-icons/md';

export default function PantryModal({ isOpen, onClose }) {
  // All hooks at the top!
  const { user, loading } = useUser();
  const { deleteByFilters, loading: deleteLoading } = useDeleteEntity('food_items');
  const [items, setItems] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [subtractAmounts, setSubtractAmounts] = useState({})
  const [showManualAddModal, setShowManualAddModal] = useState(false);

  // fetchInventory must be defined before useEffect, so move it above
  const fetchInventory = useCallback(async () => {
    if (!user) {
      return;
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
      if (process.env.NODE_ENV !== "production") {
        console.error('Error fetching inventory:', error)
      }
    } else {
      setItems(data)
    }

    setInventoryLoading(false)
  }, [user]);

  useEffect(() => {
    if (user && isOpen) {
      fetchInventory();
    }
  }, [user, isOpen, fetchInventory]);

  if (!isOpen) return null;

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
        if (process.env.NODE_ENV !== "production") {
          console.error('Update error:', error)
        }
      } else {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
        )
      }
    }

    setSubtractAmounts((prev) => ({ ...prev, [id]: '' }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:p-6 transition-opacity duration-200">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto relative transform transition-all duration-200 ease-out">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Your Pantry</h2>
                <p className="text-sm text-gray-400">Track your food inventory and pantry items</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
              aria-label="Close modal"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Add Item Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowManualAddModal(true)}
              variant="secondary"
              size="lg"
              className="w-full max-w-md"
            >
              + Add Item
            </Button>
          </div>

          {/* Inventory List */}
          {inventoryLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No pantry items yet</h3>
                <p className="text-sm text-gray-400">Add one above to get started</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-lg font-semibold">{item.name}</div>
                      <div className="text-sm text-gray-400">
                        {item.quantity} {item.unit}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Added from: {item.added_from}
                        {item.receipts?.store_name && (
                          <> (Receipt: {item.receipts.store_name})</>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Added on: {new Date(item.added_at).toLocaleDateString()}
                      </div>
                    </div>
                    <SharedDeleteButton
                      onClick={() => handleDelete(item.id)}
                      size="sm"
                      title="Delete"
                      disabled={deleteLoading}
                    />
                  </div>

                  <div className="mt-4 flex gap-2 items-center">
                    <input
                      className="bg-surface text-white px-2 py-1 rounded w-24 border border-border"
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
                    <span className="text-sm text-gray-400">{item.unit}</span>
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

        {/* Manual Add Modal */}
        {showManualAddModal && (
          <ManualPantryItemModal 
            onClose={() => setShowManualAddModal(false)}
            onAddSuccess={fetchInventory}
          />
        )}
      </div>
    </div>
  );
} 