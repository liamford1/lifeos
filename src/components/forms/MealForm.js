'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Button from '@/components/shared/Button';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import FormLabel from '@/components/shared/FormLabel';
import FormInput from '@/components/shared/FormInput';
import FormTextarea from '@/components/shared/FormTextarea';
import FormSection from '@/components/shared/FormSection';
import FormField from '@/components/shared/FormField';
import { z } from 'zod';
import { mapZodErrors } from '@/lib/utils/validationHelpers';
import { MdRestaurant } from 'react-icons/md';

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
      {/* Form Card Container */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        {/* Header with Icon */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-green-500/10 rounded-lg flex items-center justify-center">
            <MdRestaurant className="w-4 h-4 text-green-500" />
          </div>
          <h2 className="text-lg font-semibold">Meal Details</h2>
        </div>

        {/* Basic Info */}
        <FormField 
          label="Meal Name" 
          error={fieldErrors.name}
          required
        >
          <FormInput
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="e.g. Chicken Alfredo"
            disabled={loading}
          />
        </FormField>

        <FormField 
          label="Description" 
          error={fieldErrors.description}
        >
          <FormTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description"
            disabled={loading}
          />
        </FormField>

        {/* Time and Servings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <FormLabel htmlFor="prep-time">Prep Time (min)</FormLabel>
            <FormInput
              id="prep-time"
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              disabled={loading}
            />
            {fieldErrors.prep_time && <div className="text-red-400 text-xs">{fieldErrors.prep_time}</div>}
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="cook-time">Cook Time (min)</FormLabel>
            <FormInput
              id="cook-time"
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              disabled={loading}
            />
            {fieldErrors.cook_time && <div className="text-red-400 text-xs">{fieldErrors.cook_time}</div>}
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="servings">Servings</FormLabel>
            <FormInput
              id="servings"
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              disabled={loading}
            />
            {fieldErrors.servings && <div className="text-red-400 text-xs">{fieldErrors.servings}</div>}
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            <h3 className="text-base font-medium">Ingredients</h3>
          </div>
          {fieldErrors.ingredients && <div className="text-red-400 text-xs">{fieldErrors.ingredients}</div>}
          <div className="space-y-3">
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
                <SharedDeleteButton
                  onClick={() => removeIngredient(index)}
                  size="sm"
                  disabled={loading}
                  label=""
                  className="text-red-400 hover:text-red-300"
                />
                {/* Inline errors for ingredient fields */}
                {fieldErrors[`ingredients.${index}.name`] && <div className="text-red-400 text-xs ml-2">{fieldErrors[`ingredients.${index}.name`]}</div>}
                {fieldErrors[`ingredients.${index}.quantity`] && <div className="text-red-400 text-xs ml-2">{fieldErrors[`ingredients.${index}.quantity`]}</div>}
              </div>
            ))}
          </div>
          <Button 
            type="button" 
            onClick={addIngredient} 
            variant="secondary"
            size="md"
            disabled={loading}
            className="mt-2"
          >
            + Add Ingredient
          </Button>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            </div>
            <h3 className="text-base font-medium">Instructions</h3>
          </div>
          {fieldErrors.instructions && <div className="text-red-400 text-xs">{fieldErrors.instructions}</div>}
          <div className="space-y-3">
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
                <SharedDeleteButton
                  onClick={() => removeInstruction(index)}
                  size="sm"
                  disabled={loading}
                  label=""
                  className="text-red-400 hover:text-red-300"
                />
                {/* Inline error for instruction step */}
                {fieldErrors[`instructions.${index}`] && <div className="text-red-400 text-xs ml-2">{fieldErrors[`instructions.${index}`]}</div>}
              </div>
            ))}
          </div>
          <Button 
            type="button" 
            onClick={addInstruction} 
            variant="secondary"
            size="md"
            disabled={loading}
            className="mt-2"
          >
            + Add Step
          </Button>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <FormLabel htmlFor="notes">Notes</FormLabel>
          <FormTextarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any extra notes..."
            disabled={loading}
          />
          {fieldErrors.notes && <div className="text-red-400 text-xs">{fieldErrors.notes}</div>}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end pt-2">
          <div className="flex gap-3">
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                variant="secondary"
                size="md"
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              loading={loading}
              className="max-w-xs"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Meal' : 'Save Meal')}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
} 