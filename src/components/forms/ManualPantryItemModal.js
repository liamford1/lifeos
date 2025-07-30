import React from 'react';
import { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { useUser } from '@/context/UserContext';
import FormInput from '../shared/FormInput';
import FormLabel from '../shared/FormLabel';
import Button from '../shared/Button';
import SharedDeleteButton from '../SharedDeleteButton';

export default function ManualPantryItemModal({ onClose, onAddSuccess }) {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const insertItem = useMutation({
    mutationFn: (payload) =>
      fetch("/api/food/pantry/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (r) => {
        
        if (!r.ok) {
          const errorData = await r.json();
          console.error('API error response:', errorData);
          throw new Error(errorData.error);
        }
        const responseData = await r.json();
        return responseData;
      })
  });

  const handleAddItem = async (payload) => {
    try {
      await insertItem.mutateAsync(payload);
    } catch (error) {
      console.error('insertItem.mutateAsync failed:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        name: name.trim(),
        quantity: quantity ? parseFloat(quantity) : null,
        unit: unit || null,
        category: category || null,
        expires_at: expiresAt || null,
        added_from: 'manual',
        added_at: new Date().toISOString(),
      };
      await handleAddItem(payload);
      if (onAddSuccess) onAddSuccess();
      onClose();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-surface rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <SharedDeleteButton
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-2 text-xl text-muted-foreground hover:text-white p-2"
          disabled={loading}
        />
        <h2 className="text-xl font-bold mb-4">Add Pantry Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FormLabel htmlFor="name">Name<span className="text-red-400 ml-1">*</span></FormLabel>
            <FormInput
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={loading}
              placeholder="e.g. Rice, Beans, Pasta"
            />
          </div>
          <div>
            <FormLabel htmlFor="quantity">Quantity</FormLabel>
            <FormInput
              id="quantity"
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              disabled={loading}
              placeholder="e.g. 2"
            />
          </div>
          <div>
            <FormLabel htmlFor="unit">Unit</FormLabel>
            <FormInput
              id="unit"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              disabled={loading}
              placeholder="e.g. lbs, cans, boxes"
            />
          </div>
          <div>
            <FormLabel htmlFor="category">Category</FormLabel>
            <FormInput
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              disabled={loading}
              placeholder="e.g. Grains, Canned, Snacks"
            />
          </div>
          <div>
            <FormLabel htmlFor="expires_at">Expiration</FormLabel>
            <FormInput
              id="expires_at"
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 