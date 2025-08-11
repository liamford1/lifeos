"use client";

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Button from '@/components/shared/Button';
import { useDeleteEntity } from '@/lib/hooks/useSupabaseCrud';
import dynamic from "next/dynamic";
const Package = dynamic(() => import("lucide-react/dist/esm/icons/package"), { ssr: false });
import ManualPantryItemModal from '@/components/forms/ManualPantryItemModal';
import AddReceiptModal from '@/components/modals/AddReceiptModal';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import BaseModal from '@/components/shared/BaseModal';

export default function PantryModal({ isOpen, onClose }) {
  // All hooks at the top!
  const { user, loading } = useUser();
  const { deleteByFilters, loading: deleteLoading } = useDeleteEntity('food_items');
  const [items, setItems] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [showAddReceiptModal, setShowAddReceiptModal] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      const fetchInventory = async () => {
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
      };
      fetchInventory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOpen]);

  // Function to refresh inventory (for use in callbacks)
  const refreshInventory = async () => {
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
  };

  if (!isOpen) return null;

  const handleDelete = async (id) => {
    const { error } = await deleteByFilters({ id });
    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const handleSubtract = async (id) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    const newQty = parseFloat(item.quantity) - 1

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
  }

  const handleAdd = async (id) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    const newQty = parseFloat(item.quantity) + 1

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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Your Pantry"
      subtitle="Track your food inventory and pantry items"
      icon={Package}
      iconBgColor="bg-orange-500/10"
      iconColor="text-orange-500"
    >
          {/* Add Item Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setShowManualAddModal(true)}
              variant="secondary"
              size="lg"
              className="flex-1 max-w-md"
            >
              + Add Item
            </Button>
            <Button
              onClick={() => setShowAddReceiptModal(true)}
              variant="secondary"
              size="lg"
              className="flex-1 max-w-md"
            >
              + Add Receipt
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

                  <div className="mt-4 flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSubtract(item.id)}
                      aria-label="Decrease quantity"
                      className="w-8 h-8 p-0 flex items-center justify-center"
                    >
                      –
                    </Button>
                    <span className="text-sm font-medium min-w-[3rem] text-center">
                      {item.quantity} {item.unit}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdd(item.id)}
                      aria-label="Increase quantity"
                      className="w-8 h-8 p-0 flex items-center justify-center"
                    >
                      +
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

        {/* Manual Add Modal */}
        {showManualAddModal && (
          <ManualPantryItemModal 
            onClose={() => setShowManualAddModal(false)}
            onAddSuccess={refreshInventory}
          />
        )}

        {/* Add Receipt Modal */}
        <AddReceiptModal 
          isOpen={showAddReceiptModal} 
          onClose={() => setShowAddReceiptModal(false)}
          onSuccess={refreshInventory}
        />
    </BaseModal>
  );
} 