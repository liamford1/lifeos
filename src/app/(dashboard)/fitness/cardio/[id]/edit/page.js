"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BackButton from "@/components/BackButton";
import CardioForm from "@/components/CardioForm";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import { useToast } from "@/components/Toast";

export default function EditCardioPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [cardio, setCardio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  async function handleUpdateCardio(cardioData) {
    setSaving(true);
    setError("");
    const { error } = await supabase
      .from("fitness_cardio")
      .update(cardioData)
      .eq("id", id);
    if (error) {
      setError("Failed to update cardio entry");
      setSaving(false);
      return;
    }
    showSuccess("Cardio entry updated!");
    router.push(`/fitness/cardio/${id}`);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this cardio entry?")) return;
    const { error } = await supabase
      .from("fitness_cardio")
      .delete()
      .eq("id", id);
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
      <h1 className="text-xl font-bold mb-4">Edit Cardio Entry</h1>
      <CardioForm initialValues={cardio} onSubmit={handleUpdateCardio} loading={saving} />
      <Button onClick={handleDelete} variant="danger" className="mt-4">Delete</Button>
    </div>
  );
} 