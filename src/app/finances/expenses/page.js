'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';

export default function FinancesOverview() {
  const [expenses, setExpenses] = useState([]);

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (!error) setExpenses(data);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (!error) {
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    } else {
      console.error(error);
      alert('Error deleting expense.');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">Finances Overview</h1>

      <Link href="/finances/add" className="text-blue-600 underline mb-4 inline-block">
        ➕ Add New Expense
      </Link>

      {expenses.length === 0 ? (
        <p>No expenses yet.</p>
      ) : (
        <ul className="space-y-2 mt-4">
          {expenses.map((exp) => (
            <li key={exp.id} className="border p-3 rounded">
              <div className="font-semibold">{exp.name} — ${exp.amount.toFixed(2)}</div>
              <div className="text-sm text-gray-600">{exp.category} — {exp.store} — {exp.payment_method}</div>
              <div className="text-xs text-gray-500">{exp.date}</div>
              <button
                onClick={() => handleDelete(exp.id)}
                className="mt-2 text-red-600 hover:underline text-sm"
              >
                🗑️ Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
