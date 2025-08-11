import React, { useState, useCallback } from 'react';
import Button from '@/components/shared/Button';
import FormInput from '@/components/shared/FormInput';

// Memoized Set Item Component
const SetItem = React.memo(({ 
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
          onChange={e => onEditSet(index, { ...editForm, reps: e.target.value })}
          placeholder="Reps"
          title="Number of repetitions for this set"
        />
        <FormInput
          type="number"
          value={editForm.weight}
          onChange={e => onEditSet(index, { ...editForm, weight: e.target.value })}
          placeholder="Weight (lbs)"
          title="Weight used for this set (optional)"
        />
        <Button type="button" variant="primary" onClick={onSaveEdit}>Save</Button>
        <Button type="button" variant="ghost" onClick={onCancelEdit}>Cancel</Button>
      </div>
    );
  }

  return (
    <>
      <span>Set {index + 1}: {set.reps} reps{set.weight != null ? ` @ ${set.weight} lbs` : ''}</span>
      <Button type="button" variant="ghost" onClick={() => onEditSet(index)}>
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
const SetEditor = React.memo(({
  initialSets = [],
  onSetsChange,
  exerciseId,
}) => {
  const [sets, setSets] = useState(initialSets);
  const [form, setForm] = useState({ reps: '', weight: '' });
  const [editIndex, setEditIndex] = useState(null);
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
    if (form.weight !== '' && isNaN(weight)) {
      setAddError('Please enter a valid weight');
      return;
    }
    
    const newSet = { id: Date.now(), reps, weight };
    const updated = [...sets, newSet];
    setSets(updated);
    setForm({ reps: '', weight: '' });
    setAddError('');
    onSetsChange && onSetsChange(updated);
  }, [form, sets, onSetsChange]);

  const handleDeleteSet = useCallback((idx) => {
    const updated = sets.filter((_, i) => i !== idx);
    setSets(updated);
    onSetsChange && onSetsChange(updated);
  }, [sets, onSetsChange]);

  const handleEditSet = useCallback((idx, newEditForm = null) => {
    if (newEditForm) {
      setEditForm(newEditForm);
    } else {
      setEditIndex(idx);
      setEditForm({
        reps: sets[idx].reps.toString(),
        weight: sets[idx].weight != null ? sets[idx].weight.toString() : '',
      });
    }
  }, [sets]);

  const handleSaveEdit = useCallback(() => {
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
});

SetEditor.displayName = 'SetEditor';

export default SetEditor; 