"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BackButton from "@/components/shared/BackButton";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Button from "@/components/shared/Button";
import Link from "next/link";
import { useToast } from "@/components/client/Toast";

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
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

  async function handleDelete() {
    if (!window.confirm("Delete this receipt entry?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("receipts")
      .delete()
      .eq("id", id);
    if (error) {
      showError("Failed to delete receipt entry");
    } else {
      showSuccess("Receipt entry deleted");
      router.push("/finances/receipts");
    }
    setDeleting(false);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <BackButton />
      <h1 className="text-xl font-bold mb-4">Receipt Details</h1>
      {receipt && (
        <div className="mb-4">
          <div><strong>Store:</strong> {receipt.store}</div>
          <div><strong>Date:</strong> {receipt.date}</div>
          <div><strong>Total:</strong> ${receipt.total?.toFixed(2)}</div>
          <div><strong>Items:</strong> {receipt.items}</div>
          <div><strong>Notes:</strong> {receipt.notes}</div>
        </div>
      )}
      <Link href={`/finances/receipts/${id}/edit`} className="mr-2">
        <Button variant="primary">Edit</Button>
      </Link>
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
  );
} 