import React from 'react';
import { useState, useEffect } from 'react';
import FormInput from './FormInput';
import Button from './Button';

export default function SetEditor({
  initialSets = [],
  onSetsChange,
  exerciseId,
}) {
  const [sets, setSets] = useState(initialSets);
  // Add this useEffect to sync sets with initialSets
  useEffect(() => {
    setSets(initialSets);
  }, [initialSets]);
  const [form, setForm] = useState({ reps: '', weight: '' });
  const [editIndex, setEditIndex] = useState(null);
  const [editForm, setEditForm] = useState({ reps: '', weight: '' });
  const [addError, setAddError] = useState('');

  // Add new set
  const handleAddSet = () => {
    setAddError('');
    const reps = Number(form.reps);
    const weight = form.weight === '' ? null : Number(form.weight);
    if (!reps || reps < 1) {
      setAddError('Reps is required and must be at least 1.');
      return;
    }
    if (form.weight !== '' && isNaN(weight)) {
      setAddError('Weight must be a number.');
      return;
    }
    const newSet = { id: Math.random().toString(36), reps, weight };
    const updated = [...sets, newSet];
    setSets(updated);
    setForm({ reps: '', weight: '' });
    onSetsChange && onSetsChange(updated);
  };

  // Delete set
  const handleDeleteSet = (idx) => {
    const updated = sets.filter((_, i) => i !== idx);
    setSets(updated);
    onSetsChange && onSetsChange(updated);
  };

  // Start editing a set
  const handleEditSet = (idx) => {
    setEditIndex(idx);
    setEditForm({
      reps: sets[idx].reps.toString(),
      weight: sets[idx].weight != null ? sets[idx].weight.toString() : '',
    });
  };

  // Save edited set
  const handleSaveEdit = () => {
    const reps = Number(editForm.reps);
    const weight = editForm.weight === '' ? null : Number(editForm.weight);
    if (!reps || reps < 1) return;
    if (editForm.weight !== '' && isNaN(weight)) return;
    const updated = sets.map((set, i) =>
      i === editIndex ? { ...set, reps, weight } : set
    );
    setSets(updated);
    setEditIndex(null);
    setEditForm({ reps: '', weight: '' });
    onSetsChange && onSetsChange(updated);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditIndex(null);
    setEditForm({ reps: '', weight: '' });
  };

  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {sets.map((set, idx) => (
          <li key={set.id || idx} className="flex items-center gap-2">
            {editIndex === idx ? (
              <div className="flex gap-2 items-end">
                <FormInput
                  type="number"
                  min={1}
                  value={editForm.reps}
                  onChange={e => setEditForm(f => ({ ...f, reps: e.target.value }))}
                  placeholder="Reps"
                  title="Number of repetitions for this set"
                />
                <FormInput
                  type="number"
                  value={editForm.weight}
                  onChange={e => setEditForm(f => ({ ...f, weight: e.target.value }))}
                  placeholder="Weight (lbs)"
                  title="Weight used for this set (optional)"
                />
                <Button type="button" variant="primary" onClick={handleSaveEdit}>Save</Button>
                <Button type="button" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
              </div>
            ) : (
              <>
                <span>Set {idx + 1}: {set.reps} reps{set.weight != null ? ` @ ${set.weight} lbs` : ''}</span>
                <Button type="button" variant="ghost" onClick={() => handleEditSet(idx)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteSet(idx)}
                  aria-label={`Delete set ${idx + 1}`}
                >
                  🗑️ Delete
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="flex gap-2 items-end mt-2">
        <FormInput
          type="number"
          min={1}
          value={form.reps}
          onChange={e => setForm(f => ({ ...f, reps: e.target.value }))}
          placeholder="Reps"
          title="Number of repetitions for this set"
        />
        <FormInput
          type="number"
          value={form.weight}
          onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
          placeholder="Weight (lbs)"
          title="Weight used for this set (optional)"
        />
        <Button type="button" variant="primary" onClick={handleAddSet}>Add Set</Button>
      </div>
      {addError && <div className="text-red-500 mt-1">{addError}</div>}
    </div>
  );
} 