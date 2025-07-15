"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BackButton from "@/components/BackButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function InventoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, [id]);

  async function handleDelete() {
    if (!window.confirm("Delete this inventory item?")) return;
    const { error } = await supabase
      .from("inventory")
      .delete()
      .eq("id", id);
    if (error) {
      showError("Failed to delete inventory item");
    } else {
      showSuccess("Inventory item deleted");
      router.push("/food/inventory");
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <BackButton />
      <h1 className="text-xl font-bold mb-4">Inventory Item Details</h1>
      {item && (
        <div className="mb-4">
          <div><strong>Name:</strong> {item.name}</div>
          <div><strong>Quantity:</strong> {item.quantity}</div>
          <div><strong>Unit:</strong> {item.unit}</div>
          <div><strong>Category:</strong> {item.category}</div>
          <div><strong>Notes:</strong> {item.notes}</div>
        </div>
      )}
      <Link href={`/food/inventory/${id}/edit`} className="mr-2">
        <Button variant="primary">Edit</Button>
      </Link>
      <Button onClick={handleDelete} variant="danger" className="ml-2">Delete</Button>
    </div>
  );
} 