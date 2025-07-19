"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BackButton from "@/components/BackButton";
import SportForm from "@/components/SportForm";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import { useToast } from "@/components/Toast";
import DeleteButton from '@/components/DeleteButton';

export default function EditSportPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [sport, setSport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchSport() {
      if (!id) {
        setError("Missing sport ID");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("fitness_sports")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        setError("Failed to load sport entry");
      } else {
        setSport(data);
      }
      setLoading(false);
    }
    fetchSport();
  }, [id]);

  async function handleUpdateSport(sportData) {
    setSaving(true);
    setError("");
    const { error } = await supabase
      .from("fitness_sports")
      .update(sportData)
      .eq("id", id);
    if (error) {
      setError("Failed to update sport entry");
      setSaving(false);
      return;
    }
    showSuccess("Sport entry updated!");
    router.push(`/fitness/sports/${id}`);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this sport entry?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("fitness_sports")
      .delete()
      .eq("id", id);
    if (error) {
      showError("Failed to delete sport entry");
      setDeleting(false);
      return;
    }
    showSuccess("Sport entry deleted");
    router.push("/fitness/sports");
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <BackButton />
      <h1 className="text-xl font-bold mb-4">Edit Sport Entry</h1>
      <SportForm initialValues={sport} onSubmit={handleUpdateSport} loading={saving} />
      <DeleteButton
        onClick={handleDelete}
        loading={deleting}
        ariaLabel="Delete sport entry"
      />
    </div>
  );
} 