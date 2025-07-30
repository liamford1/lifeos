"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import BackButton from '@/components/shared/BackButton'
import Button from '@/components/shared/Button'
import dynamic from "next/dynamic";
const Receipt = dynamic(() => import("lucide-react/dist/esm/icons/receipt"), { ssr: false });
const ChevronDown = dynamic(() => import("lucide-react/dist/esm/icons/chevron-down"), { ssr: false });
const ChevronUp = dynamic(() => import("lucide-react/dist/esm/icons/chevron-up"), { ssr: false });

export default function AddReceiptPage(props) {
  const { user, loading } = useUser();
  const router = useRouter();

  // Move all hooks to the top level
  const [storeName, setStoreName] = useState('')
  const [items, setItems] = useState([])
  const [currentItem, setCurrentItem] = useState({ name: '', quantity: '', unit: '', price: '' })
  const [message, setMessage] = useState('')

  // Past Receipts state
  const [pastReceipts, setPastReceipts] = useState([])
  const [receiptItems, setReceiptItems] = useState({})
  const [expandedReceipts, setExpandedReceipts] = useState(new Set())
  const [loadingReceipts, setLoadingReceipts] = useState(false)
  const [receiptsError, setReceiptsError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  // Fetch past receipts when user is available
  useEffect(() => {
    if (user?.id) {
      fetchPastReceipts();
    }
  }, [user]);

  const fetchPastReceipts = async () => {
    setLoadingReceipts(true);
    setReceiptsError('');
    
    try {
      const { data: receipts, error: receiptsError } = await supabase
        .from('receipts')
        .select('id, store_name, scanned_at')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false });

      if (receiptsError) {
        console.error('Error fetching receipts:', receiptsError);
        setReceiptsError('Failed to load past receipts');
        return;
      }

      setPastReceipts(receipts || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      setReceiptsError('Failed to load past receipts');
    } finally {
      setLoadingReceipts(false);
    }
  };

  const fetchReceiptItems = async (receiptId) => {
    try {
      const { data: items, error } = await supabase
        .from('receipt_items')
        .select('id, name, quantity, unit, price')
        .eq('receipt_id', receiptId)
        .order('name');

      if (error) {
        console.error('Error fetching receipt items:', error);
        return [];
      }

      return items || [];
    } catch (error) {
      console.error('Error fetching receipt items:', error);
      return [];
    }
  };

  const toggleReceiptExpansion = async (receiptId) => {
    const newExpanded = new Set(expandedReceipts);
    
    if (newExpanded.has(receiptId)) {
      newExpanded.delete(receiptId);
    } else {
      newExpanded.add(receiptId);
      // Fetch items if not already loaded
      if (!receiptItems[receiptId]) {
        const items = await fetchReceiptItems(receiptId);
        setReceiptItems(prev => ({ ...prev, [receiptId]: items }));
      }
    }
    
    setExpandedReceipts(newExpanded);
  };

  const calculateTotalAmount = (items) => {
    return items.reduce((total, item) => {
      return total + (item.price || 0);
    }, 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

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
      if (process.env.NODE_ENV !== "production") {
        console.error('Error inserting receipt:', receiptError)
      }
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
      if (process.env.NODE_ENV !== "production") {
        console.error('Error inserting receipt items:', itemError)
      }
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
      if (process.env.NODE_ENV !== "production") {
        console.error('Error syncing to food_items:', foodError)
      }
      setMessage('Receipt saved, but failed to update inventory.')
      return
    }

    setStoreName('')
    setItems([])
    setMessage('✅ Receipt and items saved!')
    
    // Refresh past receipts to show the new one
    fetchPastReceipts();
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold flex items-center">
        <Receipt className="w-5 h-5 text-base mr-2 inline-block" />
        Add Receipt
      </h1>
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
        variant="none"
        className="bg-card text-base border border-default px-4 py-2 rounded hover:bg-[#4a4a4a] transition-colors duration-200 focus:outline-none focus:ring-0 mb-6 font-medium"
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
        variant="none"
        className="bg-card text-base border border-default px-4 py-2 rounded hover:bg-[#4a4a4a] transition-colors duration-200 focus:outline-none focus:ring-0 font-medium"
      >
        Submit Receipt
      </Button>

      {message && (
        <p className="mt-4 text-sm text-green-400">
          {message}
        </p>
      )}

      {/* Past Receipts Section */}
      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="text-xl font-bold mb-4">Past Receipts</h2>
        
        {loadingReceipts && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {receiptsError && (
          <div className="bg-red-900/20 border border-red-500/50 rounded p-4 text-red-400">
            {receiptsError}
          </div>
        )}

        {!loadingReceipts && !receiptsError && pastReceipts.length === 0 && (
          <div className="text-center py-8 text-base">
            <p>No past receipts found.</p>
            <p className="text-sm text-base mt-2">Add your first receipt above to get started.</p>
          </div>
        )}

        {!loadingReceipts && !receiptsError && pastReceipts.length > 0 && (
          <div className="space-y-3">
            {pastReceipts.map((receipt) => {
              const isExpanded = expandedReceipts.has(receipt.id);
              const items = receiptItems[receipt.id] || [];
              const totalAmount = calculateTotalAmount(items);
              
              return (
                <div key={receipt.id} className="bg-surface rounded-lg shadow border border-border">
                  <button
                    onClick={() => toggleReceiptExpansion(receipt.id)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-panel transition-colors rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-base">
                        {receipt.store_name || 'Unknown Store'}
                      </div>
                      <div className="text-sm text-base mt-1">
                        {formatDate(receipt.scanned_at)}
                      </div>
                      {items.length > 0 && (
                        <div className="text-sm text-base mt-1">
                          {items.length} item{items.length !== 1 ? 's' : ''}
                          {totalAmount > 0 && ` • $${totalAmount.toFixed(2)}`}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-base" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-base" />
                      )}
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      {items.length === 0 ? (
                        <p className="text-sm text-base py-2">No items found for this receipt.</p>
                      ) : (
                        <div className="space-y-2 mt-3">
                          {items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-panel rounded">
                              <div className="flex-1">
                                <span className="font-medium">{item.name}</span>
                                {item.quantity && item.unit && (
                                  <span className="text-sm text-base ml-2">
                                    {item.quantity} {item.unit}
                                  </span>
                                )}
                              </div>
                              {item.price && (
                                <span className="text-sm font-medium">
                                  ${item.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
