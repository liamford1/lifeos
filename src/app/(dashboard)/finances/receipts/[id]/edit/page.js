"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BackButton from "@/components/shared/BackButton";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Button from "@/components/shared/Button";
import { useToast } from "@/components/client/Toast";
import FormInput from "@/components/shared/FormInput";
import FormSection from "@/components/shared/FormSection";

export default function EditReceiptPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchReceipt() {
      if (!id) {
        setError("Missing receipt ID");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        setError("Failed to load receipt entry");
      } else {
        setReceipt(data);
      }
      setLoading(false);
    }
    fetchReceipt();
  }, [id, router]);

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = e.target;
    const updated = {
      store: form.store.value,
      date: form.date.value,
      total: parseFloat(form.total.value),
      items: form.items.value,
      notes: form.notes.value,
    };
    const { error } = await supabase
      .from("receipts")
      .update(updated)
      .eq("id", id);
    if (error) {
      setError("Failed to update receipt entry");
      setSaving(false);
      return;
    }
    showSuccess("Receipt entry updated!");
    router.push(`/finances/receipts/${id}`);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this receipt entry?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("receipts")
      .delete()
      .eq("id", id);
    if (error) {
      showError("Failed to delete receipt entry");
      setDeleting(false);
      return;
    }
    showSuccess("Receipt entry deleted");
    router.push("/finances/receipts");
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <BackButton />
      <h1 className="text-xl font-bold mb-4">Edit Receipt</h1>
      {receipt && (
        <form onSubmit={handleUpdate} className="space-y-4">
          <FormSection>
            <FormInput label="Store" name="store" defaultValue={receipt.store} required />
            <FormInput label="Date" name="date" type="date" defaultValue={receipt.date} required />
            <FormInput label="Total" name="total" type="number" step="0.01" defaultValue={receipt.total} required />
            <FormInput label="Items" name="items" defaultValue={receipt.items} />
            <FormInput label="Notes" name="notes" defaultValue={receipt.notes} />
          </FormSection>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={saving}>Save</Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              aria-label="Delete receipt entry"
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