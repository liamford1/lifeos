'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Button from '@/components/Button';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import FormTextarea from '@/components/FormTextarea';
import FormSection from '@/components/FormSection';
import { z } from 'zod';
import { mapZodErrors } from '@/lib/validationHelpers';

// Zod schema for meal form
const mealSchema = z.object({
  name: z.string().min(1, 'Meal name is required'),
  instructions: z.array(z.string().min(1, 'Instruction step is required')).min(1, 'At least one instruction is required'),
  ingredients: z.array(
    z.object({
      name: z.string().min(1, 'Ingredient name is required'),
      quantity: z.string().min(1, 'Amount is required'),
    })
  ).min(1, 'At least one ingredient is required'),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export default function MealForm({ 
  initialValues = {}, 
  onSubmit, 
  onCancel, 
  isEditing = false,
  loading = false,
  error = ''
}) {
  const [mealName, setMealName] = useState(initialValues.name || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [prepTime, setPrepTime] = useState(initialValues.prep_time || '');
  const [cookTime, setCookTime] = useState(initialValues.cook_time || '');
  const [servings, setServings] = useState(initialValues.servings || '');
  const [ingredients, setIngredients] = useState(initialValues.ingredients || [{ name: '', quantity: '', unit: '' }]);
  const [instructions, setInstructions] = useState(initialValues.instructions || ['']);
  const [tags, setTags] = useState(initialValues.tags || []);
  const [notes, setNotes] = useState(initialValues.notes || '');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialValues.name) {
      setMealName(initialValues.name);
      setDescription(initialValues.description || '');
      setPrepTime(initialValues.prep_time || '');
      setCookTime(initialValues.cook_time || '');
      setServings(initialValues.servings || '');
      setIngredients(initialValues.ingredients || [{ name: '', quantity: '', unit: '' }]);
      setInstructions(initialValues.instructions || ['']);
      setTags(initialValues.tags || []);
      setNotes(initialValues.notes || '');
    }
  }, [initialValues]);

  function addIngredient() {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  }

  function removeIngredient(index) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function handleIngredientChange(index, field, value) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  }

  function addInstruction() {
    setInstructions([...instructions, '']);
  }

  function removeInstruction(index) {
    setInstructions(instructions.filter((_, i) => i !== index));
  }

  function handleInstructionChange(index, value) {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    // Prepare data for validation
    const mealData = {
      name: mealName.trim(),
      description: description,
      prep_time: prepTime === '' ? null : Number(prepTime),
      cook_time: cookTime === '' ? null : Number(cookTime),
      servings: servings === '' ? null : Number(servings),
      instructions: instructions.map(step => step.trim()).filter(Boolean),
      ingredients: ingredients
        .map(ing => ({ name: ing.name?.trim() || '', quantity: ing.quantity?.toString() || '', unit: ing.unit || '' }))
        .filter(ing => ing.name !== '' && ing.quantity !== ''),
      tags: tags && Array.isArray(tags) ? tags : [],
      notes: notes || '',
    };
    const result = mealSchema.safeParse(mealData);
    if (!result.success) {
      setFieldErrors(mapZodErrors(result.error));
      return;
    }
    onSubmit(mealData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" role="form">
      {/* Basic Info */}
      <div>
        <FormLabel>Meal Name</FormLabel>
        <FormInput
          type="text"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          placeholder="e.g. Chicken Alfredo"
          disabled={loading}
          required
        />
        {fieldErrors.name && <div className="text-red-400 text-xs mt-1">{fieldErrors.name}</div>}
      </div>

      <div>
        <FormLabel>Description</FormLabel>
        <FormTextarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description"
          disabled={loading}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <FormLabel htmlFor="prep-time">Prep Time (min)</FormLabel>
          <FormInput
            id="prep-time"
            type="number"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="flex-1">
          <FormLabel htmlFor="cook-time">Cook Time (min)</FormLabel>
          <FormInput
            id="cook-time"
            type="number"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="flex-1">
          <FormLabel htmlFor="servings">Servings</FormLabel>
          <FormInput
            id="servings"
            type="number"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Ingredients */}
      <FormSection title="Ingredients">
        {fieldErrors.ingredients && <div className="text-red-400 text-xs mb-2">{fieldErrors.ingredients}</div>}
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex gap-2 items-center">
            <FormInput
              type="text"
              value={ingredient.name}
              onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
              placeholder="Ingredient"
              disabled={loading}
              className="flex-[2] min-w-0"
            />
            <FormInput
              type="number"
              value={ingredient.quantity}
              onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
              placeholder="Qty"
              disabled={loading}
              className="w-24"
            />
            <FormInput
              type="text"
              value={ingredient.unit}
              onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
              placeholder="Unit"
              disabled={loading}
              className="w-28"
            />
            <Button
              type="button"
              onClick={() => removeIngredient(index)}
              variant="link"
              size="sm"
              className="text-red-400 hover:text-red-300"
              disabled={loading}
              aria-label="Remove ingredient"
            >
              ×
            </Button>
            {/* Inline errors for ingredient fields */}
            {fieldErrors[`ingredients.${index}.name`] && <div className="text-red-400 text-xs ml-2">{fieldErrors[`ingredients.${index}.name`]}</div>}
            {fieldErrors[`ingredients.${index}.quantity`] && <div className="text-red-400 text-xs ml-2">{fieldErrors[`ingredients.${index}.quantity`]}</div>}
          </div>
        ))}
        <Button 
          type="button" 
          onClick={addIngredient} 
          variant="success"
          size="sm"
          disabled={loading}
          className="mt-4"
        >
          + Add Ingredient
        </Button>
      </FormSection>

      {/* Instructions */}
      <FormSection title="Instructions">
        {fieldErrors.instructions && <div className="text-red-400 text-xs mb-2">{fieldErrors.instructions}</div>}
        {instructions.map((step, index) => (
          <div key={index} className="flex items-start gap-2">
            <FormTextarea
              value={step}
              onChange={(e) => handleInstructionChange(index, e.target.value)}
              rows={2}
              placeholder={`Step ${index + 1}`}
              disabled={loading}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => removeInstruction(index)}
              variant="link"
              size="sm"
              className="text-red-400 hover:text-red-300"
              disabled={loading}
            >
              ×
            </Button>
            {/* Inline error for instruction step */}
            {fieldErrors[`instructions.${index}`] && <div className="text-red-400 text-xs ml-2">{fieldErrors[`instructions.${index}`]}</div>}
          </div>
        ))}
        <Button 
          type="button" 
          onClick={addInstruction} 
          variant="success"
          size="sm"
          disabled={loading}
          className="mt-4"
        >
          + Add Step
        </Button>
      </FormSection>

      {/* Tags (optional) */}
      {/* Add your tags input here if needed, with error display if you add a UI for it */}

      {/* Notes (optional) */}
      <div>
        <FormLabel>Notes</FormLabel>
        <FormTextarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Any extra notes..."
          disabled={loading}
        />
        {fieldErrors.notes && <div className="text-red-400 text-xs mt-1">{fieldErrors.notes}</div>}
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : (isEditing ? 'Update Meal' : 'Save Meal')}
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
} 