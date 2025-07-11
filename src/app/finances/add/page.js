'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';

export default function AddExpensePage() {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    store: '',
    payment_method: '',
    date: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = await supabase.auth.getUser();
    const user_id = user?.data?.user?.id;

    if (!user_id) {
      alert('You must be logged in.');
      return;
    }

    const { error } = await supabase.from('expenses').insert([
      {
        ...formData,
        amount: parseFloat(formData.amount),
        user_id,
      },
    ]);

    if (error) {
      console.error(error);
      alert('Error adding expense.');
    } else {
      alert('Expense added!');
      setFormData({
        name: '',
        amount: '',
        category: '',
        store: '',
        payment_method: '',
        date: '',
      });
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">Add Expense</h1>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="w-full p-2 border rounded" required />
        <input name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} placeholder="Amount" className="w-full p-2 border rounded" required />
        <input name="category" value={formData.category} onChange={handleChange} placeholder="Category" className="w-full p-2 border rounded" />
        <input name="store" value={formData.store} onChange={handleChange} placeholder="Store" className="w-full p-2 border rounded" />
        <input name="payment_method" value={formData.payment_method} onChange={handleChange} placeholder="Payment Method" className="w-full p-2 border rounded" />
        <input name="date" type="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded" required />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded w-full">Add Expense</button>
      </form>
    </div>
  );
}
