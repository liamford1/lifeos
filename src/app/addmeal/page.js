'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AddMealPage() {
  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');

  const [ingredients, setIngredients] = useState([]);

  const [instructions, setInstructions] = useState([]);

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

  async function handleSaveMeal() {
    const user = await supabase.auth.getUser();
    const userId = user?.data?.user?.id;
  
    if (!userId) {
      alert('User not logged in.');
      return;
    }
  
    // Insert meal first
    const { error: mealError, data: mealData } = await supabase.from('meals').insert([
      {
        user_id: userId,
        name: mealName,
        description,
        prep_time: prepTime ? parseInt(prepTime) : null,
        cook_time: cookTime ? parseInt(cookTime) : null,
        servings: servings ? parseInt(servings) : null,
        instructions,
      }
    ]).select().single(); // 👈 This gives us the inserted meal row back
  
    if (mealError || !mealData) {
      console.error(mealError);
      alert('Failed to save meal.');
      return;
    }
  
    const mealId = mealData.id;
  
    // Insert all ingredients, tied to the meal
    const ingredientsToInsert = ingredients.map((ing) => ({
        meal_id: mealId,
        name: ing.name,
        food_item_name: ing.name, // ✅ use name for both
        quantity: ing.quantity ? parseFloat(ing.quantity) : null,
        unit: ing.unit || null,
    }));      
  
    const { error: ingError } = await supabase.from('meal_ingredients').insert(ingredientsToInsert);
  
    if (ingError) {
      console.error(ingError);
      alert('Meal saved, but failed to save ingredients.');
    } else {
      alert('Meal and ingredients saved!');
      // Optional: clear form
    }
  }    

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add a New Meal</h1>

      <form className="space-y-4">
        {/* Meal Metadata */}
        <div>
          <label className="block font-semibold">Meal Name</label>
          <input
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g. Chicken Alfredo"
          />
        </div>

        <div>
          <label className="block font-semibold">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
            placeholder="Brief description of the meal"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-semibold">Prep Time (min)</label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block font-semibold">Cook Time (min)</label>
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block font-semibold">Servings</label>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Ingredients Section */}
        <hr className="my-6" />
        <h2 className="text-xl font-semibold mb-2">Ingredients</h2>

        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex gap-2 mb-2 items-center">
            <input
              type="text"
              value={ingredient.name}
              onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder="Ingredient name"
            />
            <input
              type="number"
              value={ingredient.quantity}
              onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
              className="w-24 p-2 border rounded"
              placeholder="Qty"
            />
            <input
              type="text"
              value={ingredient.unit}
              onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
              className="w-28 p-2 border rounded"
              placeholder="Unit"
            />
            <button
              type="button"
              onClick={() => removeIngredient(index)}
              className="text-red-600 hover:underline"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addIngredient}
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          + Add Ingredient
        </button>

        {/* Instructions Section */}
        <hr className="my-6" />
        <h2 className="text-xl font-semibold mb-2">Instructions</h2>

        {instructions.map((step, index) => (
          <div key={index} className="flex items-start gap-2 mb-2">
            <textarea
              value={step}
              onChange={(e) => handleInstructionChange(index, e.target.value)}
              className="flex-1 p-2 border rounded"
              rows={2}
              placeholder={`Step ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeInstruction(index)}
              className="text-red-600 hover:underline"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addInstruction}
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          + Add Step
        </button>

        {/* Save Button (Non-functional for now) */}
        <div className="pt-4">
            <button
                type="button"
                onClick={handleSaveMeal}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Save Meal
            </button>
        </div>
      </form>
    </div>
  );
}
