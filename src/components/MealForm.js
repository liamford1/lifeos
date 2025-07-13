'use client';

import { useState, useEffect } from 'react';

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
  const [prepTime, setPrepTime] = useState(initialValues.prep_time?.toString() || '');
  const [cookTime, setCookTime] = useState(initialValues.cook_time?.toString() || '');
  const [servings, setServings] = useState(initialValues.servings?.toString() || '');
  const [ingredients, setIngredients] = useState(initialValues.ingredients || []);
  const [instructions, setInstructions] = useState(initialValues.instructions || []);

  // Update form values when initialValues change (for editing)
  useEffect(() => {
    setMealName(initialValues.name || '');
    setDescription(initialValues.description || '');
    setPrepTime(initialValues.prep_time?.toString() || '');
    setCookTime(initialValues.cook_time?.toString() || '');
    setServings(initialValues.servings?.toString() || '');
    setIngredients(initialValues.ingredients || []);
    setInstructions(initialValues.instructions || []);
  }, [
    initialValues.name,
    initialValues.description,
    initialValues.prep_time,
    initialValues.cook_time,
    initialValues.servings,
    JSON.stringify(initialValues.ingredients),
    JSON.stringify(initialValues.instructions)
  ]);

  function addIngredient() {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  }

  function removeIngredient(index) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function handleIngredientChange(index, field, value) {
    const updated = [...ingredients];
    updated[index][field] = value;
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
        <label className="block font-semibold mb-1 text-white">Meal Name</label>
        <input
          type="text"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded text-white"
          placeholder="e.g. Chicken Alfredo"
          disabled={loading}
          required
        />
      </div>

      <div>
        <label className="block font-semibold mb-1 text-white">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded text-white"
          rows={3}
          placeholder="Brief description"
          disabled={loading}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-semibold mb-1 text-white">Prep Time (min)</label>
          <input
            type="number"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
            disabled={loading}
          />
        </div>
        <div className="flex-1">
          <label className="block font-semibold mb-1 text-white">Cook Time (min)</label>
          <input
            type="number"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
            disabled={loading}
          />
        </div>
        <div className="flex-1">
          <label className="block font-semibold mb-1 text-white">Servings</label>
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
            disabled={loading}
          />
        </div>
      </div>

      {/* Ingredients */}
      <hr className="border-gray-700" />
      <h2 className="text-xl font-semibold text-white">Ingredients</h2>
      {ingredients.map((ingredient, index) => (
        <div key={index} className="flex gap-2 items-center">
          <input
            type="text"
            value={ingredient.name}
            onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
            className="flex-1 p-2 bg-gray-700 rounded text-white"
            placeholder="Ingredient"
            disabled={loading}
          />
          <input
            type="number"
            value={ingredient.quantity}
            onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
            className="w-24 p-2 bg-gray-700 rounded text-white"
            placeholder="Qty"
            disabled={loading}
          />
          <input
            type="text"
            value={ingredient.unit}
            onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
            className="w-28 p-2 bg-gray-700 rounded text-white"
            placeholder="Unit"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => removeIngredient(index)}
            className="text-red-400 hover:underline"
            disabled={loading}
          >
            ✕
          </button>
        </div>
      ))}
      <button 
        type="button" 
        onClick={addIngredient} 
        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
        disabled={loading}
      >
        + Add Ingredient
      </button>

      {/* Instructions */}
      <hr className="border-gray-700" />
      <h2 className="text-xl font-semibold text-white">Instructions</h2>
      {instructions.map((step, index) => (
        <div key={index} className="flex items-start gap-2">
          <textarea
            value={step}
            onChange={(e) => handleInstructionChange(index, e.target.value)}
            className="flex-1 p-2 bg-gray-700 rounded text-white"
            rows={2}
            placeholder={`Step ${index + 1}`}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => removeInstruction(index)}
            className="text-red-400 hover:underline"
            disabled={loading}
          >
            ✕
          </button>
        </div>
      ))}
      <button 
        type="button" 
        onClick={addInstruction} 
        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
        disabled={loading}
      >
        + Add Step
      </button>

      {/* Error Display */}
      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Saving...' : (isEditing ? 'Update Meal' : 'Save Meal')}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
} 