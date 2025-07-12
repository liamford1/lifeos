'use client'

import AppBar from '@/components/AppBar'
import BackButton from '@/components/BackButton'

export default function FoodDashboard() {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <AppBar />

      <main className="flex flex-grow overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 bg-gray-800 p-6 overflow-auto">
          <nav className="flex flex-col gap-4">
            <a
              href="/food"
              className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 transition text-center font-semibold"
            >
              🍽️ Food / Diet
            </a>

            <a
              href="/fitness"
              className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 transition text-center font-semibold"
            >
              🏋️ Fitness
            </a>

            <a
              href="/finances"
              className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 transition text-center font-semibold"
            >
              💸 Finances
            </a>

            <a
              href="/scratchpad"
              className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 transition text-center font-semibold"
            >
              🧠 Scratchpad
            </a>
          </nav>
        </aside>

        {/* Right Content */}
        <section className="flex-grow p-8 overflow-auto">
          <BackButton />
          <h1 className="text-2xl font-bold mb-6">🍽️ Food & Diet Dashboard</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="/food/inventory"
              className="block p-6 bg-gray-700 rounded shadow hover:bg-gray-600 transition"
            >
              🧺 <span className="font-semibold">View Pantry</span>
              <p className="text-sm text-gray-300 mt-1">See what you have in stock</p>
            </a>

            <a
              href="/food/addreceipt"
              className="block p-6 bg-gray-700 rounded shadow hover:bg-gray-600 transition"
            >
              ➕ <span className="font-semibold">Add Pantry Item</span>
              <p className="text-sm text-gray-300 mt-1">Manually add or scan items</p>
            </a>

            <a
              href="/food/meals"
              className="block p-6 bg-gray-700 rounded shadow hover:bg-gray-600 transition"
            >
              📖 <span className="font-semibold">View Meals</span>
              <p className="text-sm text-gray-300 mt-1">Browse your saved meals</p>
            </a>

            <a
              href="/food/addmeal"
              className="block p-6 bg-gray-700 rounded shadow hover:bg-gray-600 transition"
            >
              ➕ <span className="font-semibold">Add a Meal</span>
              <p className="text-sm text-gray-300 mt-1">Create a new meal manually</p>
            </a>

            <a
              href="/food/planner"
              className="block p-6 bg-gray-700 rounded shadow hover:bg-gray-600 transition"
            >
              🗓️ <span className="font-semibold">Plan Meals</span>
              <p className="text-sm text-gray-300 mt-1">Schedule meals for the week</p>
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
