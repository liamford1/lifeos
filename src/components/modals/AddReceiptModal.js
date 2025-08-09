"use client";

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Button from '@/components/shared/Button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/client/Toast';
import BaseModal from '@/components/shared/BaseModal';
import dynamic from "next/dynamic";
const Receipt = dynamic(() => import("lucide-react/dist/esm/icons/receipt"), { ssr: false });
const ChevronDown = dynamic(() => import("lucide-react/dist/esm/icons/chevron-down"), { ssr: false });
const ChevronUp = dynamic(() => import("lucide-react/dist/esm/icons/chevron-up"), { ssr: false });

export default function AddReceiptModal({ isOpen, onClose, onSuccess }) {
  const { user, loading: userLoading } = useUser();
  const { showSuccess, showError } = useToast();

  // Form state
  const [storeName, setStoreName] = useState('');
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({ name: '', quantity: '', unit: '', price: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Past Receipts state
  const [pastReceipts, setPastReceipts] = useState([]);
  const [receiptItems, setReceiptItems] = useState({});
  const [expandedReceipts, setExpandedReceipts] = useState(new Set());
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [receiptsError, setReceiptsError] = useState('');

  const fetchPastReceipts = useCallback(async () => {
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
  }, [user?.id]);

  // Fetch past receipts when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchPastReceipts();
    }
  }, [isOpen, user, fetchPastReceipts]);

  // Don't render if not open
  if (!isOpen) return null;

  // Show loading spinner when user is loading
  if (userLoading) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Loading..."
        subtitle="Please wait"
        icon={Receipt}
        iconBgColor="bg-blue-500/10"
        iconColor="text-blue-500"
        maxWidth="max-w-6xl"
      >
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </BaseModal>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

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

  const handleAddItem = () => {
    if (!currentItem.name || !currentItem.quantity || !currentItem.unit) {
      showError('Please fill in item name, quantity, and unit');
      return;
    }
    setItems([...items, currentItem]);
    setCurrentItem({ name: '', quantity: '', unit: '', price: '' });
  };

  const handleSubmit = async () => {
    if (!storeName || items.length === 0) {
      showError('Please enter a store name and at least one item.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .insert([{ user_id: user.id, store_name: storeName }])
        .select()
        .single();

      if (receiptError) {
        if (process.env.NODE_ENV !== "production") {
          console.error('Error inserting receipt:', receiptError);
        }
        showError('Error creating receipt.');
        return;
      }

      const receiptId = receiptData.id;

      const receiptItems = items.map(item => ({
        receipt_id: receiptId,
        name: item.name,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        price: item.price ? parseFloat(item.price) : null
      }));

      const { error: itemError } = await supabase
        .from('receipt_items')
        .insert(receiptItems);

      if (itemError) {
        if (process.env.NODE_ENV !== "production") {
          console.error('Error inserting receipt items:', itemError);
        }
        showError('Error adding items to receipt.');
        return;
      }

      const foodItems = items.map(item => ({
        user_id: user.id,
        name: item.name,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        added_from: 'receipt',
        receipt_id: receiptId
      }));

      const { error: foodError } = await supabase
        .from('food_items')
        .insert(foodItems);

      if (foodError) {
        if (process.env.NODE_ENV !== "production") {
          console.error('Error syncing to food_items:', foodError);
        }
        showError('Receipt saved, but failed to update inventory.');
        return;
      }

      // Reset form
      setStoreName('');
      setItems([]);
      setCurrentItem({ name: '', quantity: '', unit: '', price: '' });
      
      showSuccess('✅ Receipt and items saved!');
      
      // Refresh past receipts to show the new one
      fetchPastReceipts();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error submitting receipt:', error);
      showError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form state
    setStoreName('');
    setItems([]);
    setCurrentItem({ name: '', quantity: '', unit: '', price: '' });
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Add Receipt"
      subtitle="Add items from a receipt to your pantry inventory"
      icon={Receipt}
      iconBgColor="bg-blue-500/10"
      iconColor="text-blue-500"
      maxWidth="max-w-6xl"
    >
      <div className="space-y-6">
        {/* Store Name Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Store Name</label>
          <input
            className="bg-panel border border-border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Store name (e.g. Safeway)"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
        </div>

        {/* Add Items Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Add Items</h3>
          
          {/* Item Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input
              className="bg-panel border border-border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Item name"
              value={currentItem.name}
              onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
            />
            <input
              className="bg-panel border border-border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Qty"
              value={currentItem.quantity}
              onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
            />
            <input
              className="bg-panel border border-border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Unit"
              value={currentItem.unit}
              onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
            />
            <input
              className="bg-panel border border-border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Price"
              value={currentItem.price}
              onChange={(e) => setCurrentItem({ ...currentItem, price: e.target.value })}
            />
          </div>

          <Button
            onClick={handleAddItem}
            variant="secondary"
            size="md"
            className="mb-6"
          >
            + Add Item
          </Button>

          {/* Items List */}
          {items.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3">Added Items</h4>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li key={index} className="bg-panel p-3 rounded-lg border border-border">
                    <span className="font-semibold">{item.name}</span> — {item.quantity} {item.unit}
                    {item.price && <span className="text-base"> (${item.price})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              variant="primary"
              size="md"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="max-w-xs"
            >
              {isSubmitting ? 'Saving Receipt...' : 'Submit Receipt'}
            </Button>
          </div>
        </div>

        {/* Past Receipts Section */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold mb-4">Past Receipts</h3>
          
          {loadingReceipts && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {receiptsError && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              {receiptsError}
            </div>
          )}

          {!loadingReceipts && !receiptsError && pastReceipts.length === 0 && (
            <div className="text-center py-8 text-base">
              <p>No past receipts found.</p>
              <p className="text-sm text-gray-400 mt-2">Add your first receipt above to get started.</p>
            </div>
          )}

          {!loadingReceipts && !receiptsError && pastReceipts.length > 0 && (
            <div className="space-y-3">
              {pastReceipts.map((receipt) => {
                const isExpanded = expandedReceipts.has(receipt.id);
                const items = receiptItems[receipt.id] || [];
                const totalAmount = calculateTotalAmount(items);
                
                return (
                  <div key={receipt.id} className="bg-panel rounded-lg border border-border">
                    <button
                      onClick={() => toggleReceiptExpansion(receipt.id)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-surface transition-colors rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-base">
                          {receipt.store_name || 'Unknown Store'}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {formatDate(receipt.scanned_at)}
                        </div>
                        {items.length > 0 && (
                          <div className="text-sm text-gray-400 mt-1">
                            {items.length} item{items.length !== 1 ? 's' : ''}
                            {totalAmount > 0 && ` • $${totalAmount.toFixed(2)}`}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        {items.length === 0 ? (
                          <p className="text-sm text-gray-400 py-2">No items found for this receipt.</p>
                        ) : (
                          <div className="space-y-2 mt-3">
                            {items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-surface rounded">
                                <div className="flex-1">
                                  <span className="font-medium">{item.name}</span>
                                  {item.quantity && item.unit && (
                                    <span className="text-sm text-gray-400 ml-2">
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
    </BaseModal>
  );
} 