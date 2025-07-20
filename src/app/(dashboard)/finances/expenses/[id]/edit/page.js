"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BackButton from "@/components/BackButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import { useToast } from "@/components/Toast";
import FormInput from "@/components/FormInput";
import FormSection from "@/components/FormSection";
import { CALENDAR_SOURCES, updateCalendarEventFromSource } from '@/lib/calendarUtils';

export default function EditExpensePage() {
  const { id } = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchExpense() {
      if (!id) {
        setError("Missing expense ID");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        setError("Failed to load expense entry");
      } else {
        setExpense(data);
      }
      setLoading(false);
    }
    fetchExpense();
  }, [id]);

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = e.target;
    const updated = {
      name: form.name.value,
      amount: parseFloat(form.amount.value),
      category: form.category.value,
      store: form.store.value,
      payment_method: form.payment_method.value,
      date: form.date.value,
      notes: form.notes.value,
    };
    const { error } = await supabase
      .from("expenses")
      .update(updated)
      .eq("id", id);
    if (error) {
      setError("Failed to update expense entry");
      setSaving(false);
      return;
    }
    // Update linked calendar event
    const calendarError = await updateCalendarEventFromSource(
      CALENDAR_SOURCES.EXPENSE,
      id,
      {
        title: `Expense: ${updated.name} - $${updated.amount}`,
        start_time: updated.date ? new Date(updated.date).toISOString() : undefined,
        description: updated.notes || null,
      }
    );
    if (calendarError) {
      console.error('Calendar event update failed:', calendarError);
    }
    showSuccess("Expense entry updated!");
    router.push(`/finances/expenses/${id}`);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this expense entry?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);
    if (error) {
      showError("Failed to delete expense entry");
      setDeleting(false);
      return;
    }
    // Update linked calendar event
    const calendarError = await updateCalendarEventFromSource(
      CALENDAR_SOURCES.EXPENSE,
      id,
      {
        title: `Expense: ${expense.name} - $${expense.amount}`,
        start_time: expense.date ? new Date(expense.date).toISOString() : undefined,
        description: expense.notes || null,
      }
    );
    if (calendarError) {
      console.error('Calendar event update failed:', calendarError);
    }
    showSuccess("Expense entry deleted");
    router.push("/finances/expenses");
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <BackButton />
      <h1 className="text-xl font-bold mb-4">Edit Expense</h1>
      {expense && (
        <form onSubmit={handleUpdate} className="space-y-4">
          <FormSection>
            <FormInput label="Name" name="name" defaultValue={expense.name} required />
            <FormInput label="Amount" name="amount" type="number" step="0.01" defaultValue={expense.amount} required />
            <FormInput label="Category" name="category" defaultValue={expense.category} />
            <FormInput label="Store" name="store" defaultValue={expense.store} />
            <FormInput label="Payment Method" name="payment_method" defaultValue={expense.payment_method} />
            <FormInput label="Date" name="date" type="date" defaultValue={expense.date} />
            <FormInput label="Notes" name="notes" defaultValue={expense.notes} />
          </FormSection>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={saving}>Save</Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              aria-label="Delete expense entry"
              loading={deleting}
            >
              🗑️ Delete
            </Button>
          </div>
        </form>
      )}
    </div>
  );
} 