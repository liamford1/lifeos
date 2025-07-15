'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/Button';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import FormTextarea from '@/components/FormTextarea';
import FormSection from '@/components/FormSection';

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

  useEffect(() => {
    if (initialValues.name) {
      setMealName(initialValues.name);
      setDescription(initialValues.description || '');
      setPrepTime(initialValues.prep_time || '');
      setCookTime(initialValues.cook_time || '');
      setServings(initialValues.servings || '');
      setIngredients(initialValues.ingredients || [{ name: '', quantity: '', unit: '' }]);
      setInstructions(initialValues.instructions || ['']);
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
    
    const mealData = {
      name: mealName.trim(),
      description: description.trim() || null,
      prep_time: prepTime ? parseInt(prepTime) : null,
      cook_time: cookTime ? parseInt(cookTime) : null,
      servings: servings ? parseInt(servings) : null,
      instructions: instructions.filter(step => step.trim()),
      ingredients: ingredients.filter(ing => 
        ing.name?.trim() !== '' &&
        ing.quantity !== '' &&
        ing.unit?.trim() !== ''
      ),
    };

    console.log('📤 MealForm submitting data:', mealData);
    onSubmit(mealData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          <FormLabel>Prep Time (min)</FormLabel>
          <FormInput
            type="number"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="flex-1">
          <FormLabel>Cook Time (min)</FormLabel>
          <FormInput
            type="number"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="flex-1">
          <FormLabel>Servings</FormLabel>
          <FormInput
            type="number"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Ingredients */}
      <FormSection title="Ingredients">
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex gap-2 items-center">
            <FormInput
              type="text"
              value={ingredient.name}
              onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
              placeholder="Ingredient"
              disabled={loading}
              className="flex-1"
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
              ✕
            </Button>
          </div>
        ))}
        <Button 
          type="button" 
          onClick={addIngredient} 
          variant="success"
          size="sm"
          disabled={loading}
        >
          + Add Ingredient
        </Button>
      </FormSection>

      {/* Instructions */}
      <FormSection title="Instructions">
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
              ✕
            </Button>
          </div>
        ))}
        <Button 
          type="button" 
          onClick={addInstruction} 
          variant="success"
          size="sm"
          disabled={loading}
        >
          + Add Step
        </Button>
      </FormSection>

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