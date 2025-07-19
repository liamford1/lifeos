"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BackButton from "@/components/BackButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import DeleteButton from '@/components/DeleteButton';

export default function CardioDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [cardio, setCardio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchCardio() {
      if (!id) {
        setError("Missing cardio ID");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("fitness_cardio")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        setError("Failed to load cardio entry");
      } else {
        setCardio(data);
      }
      setLoading(false);
    }
    fetchCardio();
  }, [id]);

  async function handleDelete() {
    if (!window.confirm("Delete this cardio entry?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("fitness_cardio")
      .delete()
      .eq("id", id);
    setDeleting(false);
    if (error) {
      showError("Failed to delete cardio entry");
    } else {
      showSuccess("Cardio entry deleted");
      router.push("/fitness/cardio");
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <BackButton />
      <h1 className="text-xl font-bold mb-4">Cardio Entry Details</h1>
      {cardio && (
        <div className="mb-4">
          <div><strong>Type:</strong> {cardio.type}</div>
          <div><strong>Duration:</strong> {cardio.duration} min</div>
          <div><strong>Date:</strong> {cardio.date}</div>
          <div><strong>Notes:</strong> {cardio.notes}</div>
        </div>
      )}
      <Link href={`/fitness/cardio/${id}/edit`} className="mr-2">
        <Button variant="primary">Edit</Button>
      </Link>
      <DeleteButton
        onClick={handleDelete}
        loading={deleting}
        ariaLabel="Delete cardio entry"
      />
    </div>
  );
}
