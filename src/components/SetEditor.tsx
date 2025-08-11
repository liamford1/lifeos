import React, { useState, useCallback } from 'react';
import Button from '@/components/shared/Button';
import FormInput from '@/components/shared/FormInput';

interface Set {
  id?: string;
  reps: number;
  weight: number | null;
}

interface SetItemProps {
  set: Set;
  index: number;
  editIndex: number | null;
  editForm: { reps: string; weight: string };
  onEditSet: (index: number, form?: { reps: string; weight: string }) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteSet: (index: number) => void;
}

interface SetEditorProps {
  initialSets?: Set[];
  onSetsChange?: (sets: Set[]) => void;
}

// Memoized Set Item Component
const SetItem = React.memo<SetItemProps>(({ 
  set, 
  index, 
  editIndex, 
  editForm, 
  onEditSet, 
  onSaveEdit, 
  onCancelEdit, 
  onDeleteSet 
}) => {
  if (editIndex === index) {
    return (
      <div className="flex gap-2 items-end">
        <FormInput
          type="number"
          min={1}
          value={editForm.reps}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEditSet(index, { ...editForm, reps: e.target.value })}
          placeholder="Reps"
          title="Number of repetitions for this set"
        />
        <FormInput
          type="number"
          value={editForm.weight}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEditSet(index, { ...editForm, weight: e.target.value })}
          placeholder="Weight (lbs)"
          title="Weight used for this set (optional)"
        />
        <Button type="button" variant="primary" onClick={onSaveEdit} aria-label="Save set changes">Save</Button>
        <Button type="button" variant="ghost" onClick={onCancelEdit} aria-label="Cancel editing">Cancel</Button>
      </div>
    );
  }

  return (
    <>
      <span>Set {index + 1}: {set.reps} reps{set.weight != null ? ` @ ${set.weight} lbs` : ''}</span>
      <Button type="button" variant="ghost" onClick={() => onEditSet(index)} aria-label={`Edit set ${index + 1}`}>
        Edit
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={() => onDeleteSet(index)}
        aria-label={`Delete set ${index + 1}`}
      >
        🗑️ Delete
      </Button>
    </>
  );
});

SetItem.displayName = 'SetItem';

// Memoized SetEditor Component
const SetEditor = React.memo<SetEditorProps>(({
  initialSets = [],
  onSetsChange,
}) => {
  const [sets, setSets] = useState<Set[]>(initialSets);
  const [form, setForm] = useState({ reps: '', weight: '' });
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ reps: '', weight: '' });
  const [addError, setAddError] = useState('');

  // Memoized handlers
  const handleAddSet = useCallback(() => {
    const reps = Number(form.reps);
    const weight = form.weight === '' ? null : Number(form.weight);
    
    if (!reps || reps < 1) {
      setAddError('Please enter a valid number of reps');
      return;
    }
    if (form.weight !== '' && isNaN(weight!)) {
      setAddError('Please enter a valid weight');
      return;
    }
    
    const newSet = { id: Date.now().toString(), reps, weight };
    const updated = [...sets, newSet];
    setSets(updated);
    setForm({ reps: '', weight: '' });
    setAddError('');
    onSetsChange && onSetsChange(updated);
  }, [form, sets, onSetsChange]);

  const handleDeleteSet = useCallback((idx: number) => {
    const updated = sets.filter((_, i) => i !== idx);
    setSets(updated);
    onSetsChange && onSetsChange(updated);
  }, [sets, onSetsChange]);

  const handleEditSet = useCallback((idx: number, newEditForm?: { reps: string; weight: string }) => {
    if (newEditForm) {
      setEditForm(newEditForm);
    } else {
      const set = sets[idx];
      if (set) {
        setEditIndex(idx);
        setEditForm({
          reps: set.reps.toString(),
          weight: set.weight != null ? set.weight.toString() : '',
        });
      }
    }
  }, [sets]);

  const handleSaveEdit = useCallback(() => {
    const reps = Number(editForm.reps);
    const weight = editForm.weight === '' ? null : Number(editForm.weight);
    if (!reps || reps < 1) return;
    if (editForm.weight !== '' && isNaN(weight!)) return;
    const updated = sets.map((set, i) =>
      i === editIndex ? { ...set, reps, weight } : set
    );
    setSets(updated);
    setEditIndex(null);
    setEditForm({ reps: '', weight: '' });
    onSetsChange && onSetsChange(updated);
  }, [editForm, editIndex, sets, onSetsChange]);

  const handleCancelEdit = useCallback(() => {
    setEditIndex(null);
    setEditForm({ reps: '', weight: '' });
  }, []);

  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {sets.map((set, idx) => (
          <li key={set.id || idx} className="flex items-center gap-2">
            <SetItem
              set={set}
              index={idx}
              editIndex={editIndex}
              editForm={editForm}
              onEditSet={handleEditSet}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onDeleteSet={handleDeleteSet}
            />
          </li>
        ))}
      </ul>
      <div className="flex gap-2 items-end mt-2">
        <FormInput
          type="number"
          min={1}
          value={form.reps}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, reps: e.target.value }))}
          placeholder="Reps"
          title="Number of repetitions for this set"
        />
        <FormInput
          type="number"
          value={form.weight}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, weight: e.target.value }))}
          placeholder="Weight (lbs)"
          title="Weight used for this set (optional)"
        />
        <Button type="button" variant="primary" onClick={handleAddSet} aria-label="Add new set">Add Set</Button>
      </div>
      {addError && <div className="text-red-500 mt-1">{addError}</div>}
    </div>
  );
});

SetEditor.displayName = 'SetEditor';

export default SetEditor;
