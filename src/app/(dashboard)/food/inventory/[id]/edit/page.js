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

export default function EditInventoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchItem() {
      if (!id) {
        setError("Missing inventory item ID");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        setError("Failed to load inventory item");
      } else {
        setItem(data);
      }
      setLoading(false);
    }
    fetchItem();
  }, [id, router]);

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = e.target;
    const updated = {
      name: form.name.value,
      quantity: form.quantity.value,
      unit: form.unit.value,
      category: form.category.value,
      notes: form.notes.value,
    };
    const { error } = await supabase
      .from("inventory")
      .update(updated)
      .eq("id", id);
    if (error) {
      setError("Failed to update inventory item");
      setSaving(false);
      return;
    }
    showSuccess("Inventory item updated!");
    router.push(`/food/inventory/${id}`);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this inventory item?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("inventory")
      .delete()
      .eq("id", id);
    if (error) {
      showError("Failed to delete inventory item");
      setDeleting(false);
      return;
    }
    showSuccess("Inventory item deleted");
    router.push("/food/inventory");
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <BackButton />
      <h1 className="text-xl font-bold mb-4">Edit Inventory Item</h1>
      {item && (
        <form onSubmit={handleUpdate} className="space-y-4">
          <FormSection>
            <FormInput label="Name" name="name" defaultValue={item.name} required />
            <FormInput label="Quantity" name="quantity" defaultValue={item.quantity} required />
            <FormInput label="Unit" name="unit" defaultValue={item.unit} />
            <FormInput label="Category" name="category" defaultValue={item.category} />
            <FormInput label="Notes" name="notes" defaultValue={item.notes} />
          </FormSection>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={saving}>Save</Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              aria-label="Delete inventory item"
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