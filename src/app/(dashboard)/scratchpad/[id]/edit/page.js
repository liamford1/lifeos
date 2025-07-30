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

export default function EditScratchpadPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchNote() {
      if (!id) {
        setError("Missing note ID");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("scratchpad_entries")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        setError("Failed to load note");
      } else {
        setNote(data);
      }
      setLoading(false);
    }
    fetchNote();
  }, [id]);

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = e.target;
    const updated = {
      content: form.content.value,
      category: form.category.value,
    };
    if (!updated.category) delete updated.category;
    if (!updated.content) {
      setError("Content cannot be empty");
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from("scratchpad_entries")
      .update(updated)
      .eq("id", id);
    if (error) {
      setError("Failed to update note");
      setSaving(false);
      return;
    }
    showSuccess("Note updated!");
    router.push(`/scratchpad/${id}`);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this note?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("scratchpad_entries")
      .delete()
      .eq("id", id);
    if (error) {
      showError("Failed to delete note");
      setDeleting(false);
    } else {
      showSuccess("Note deleted");
      router.push("/scratchpad");
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <BackButton />
      <h1 className="text-xl font-bold mb-4">Edit Note</h1>
      {note && (
        <form onSubmit={handleUpdate} className="space-y-4">
          <FormSection>
            <FormInput label="Content" name="content" defaultValue={note.content} required />
            <FormInput label="Category" name="category" defaultValue={note.category} />
          </FormSection>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={saving}>Save</Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              aria-label="Delete note"
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