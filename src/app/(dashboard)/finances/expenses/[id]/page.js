"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BackButton from "@/components/BackButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
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

  async function handleDelete() {
    if (!window.confirm("Delete this expense entry?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);
    setDeleting(false);
    if (error) {
      showError("Failed to delete expense entry");
    } else {
      showSuccess("Expense entry deleted");
      router.push("/finances/expenses");
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <BackButton />
      <h1 className="text-xl font-bold mb-4">Expense Details</h1>
      {expense && (
        <div className="mb-4">
          <div><strong>Name:</strong> {expense.name}</div>
          <div><strong>Amount:</strong> ${expense.amount?.toFixed(2)}</div>
          <div><strong>Category:</strong> {expense.category}</div>
          <div><strong>Store:</strong> {expense.store}</div>
          <div><strong>Payment Method:</strong> {expense.payment_method}</div>
          <div><strong>Date:</strong> {expense.date}</div>
          <div><strong>Notes:</strong> {expense.notes}</div>
        </div>
      )}
      <Link href={`/finances/expenses/${id}/edit`} className="mr-2">
        <Button variant="primary">Edit</Button>
      </Link>
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
  );
} 