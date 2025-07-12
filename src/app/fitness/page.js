'use client'

import AppBar from '@/components/AppBar'
import BackButton from '@/components/BackButton'

export default function FitnessHome() {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <AppBar />

      <main className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 p-6 overflow-auto">
          <nav className="flex flex-col gap-4">
            <a href="/food" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">🍽️ Food / Diet</a>
            <a href="/fitness" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">🏋️ Fitness</a>
            <a href="/finances" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">💸 Finances</a>
            <a href="/scratchpad" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">🧠 Scratchpad</a>
          </nav>
        </aside>

        {/* Main Content */}
        <section className="flex-grow p-8 overflow-auto">
          <BackButton />
          <h1 className="text-2xl font-bold mb-6">🏋️ Fitness Dashboard</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="/fitness/workouts" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
              🏋️‍♂️ <span className="font-semibold">Workouts</span> <div className="text-sm text-gray-400">Weightlifting sessions</div>
            </a>

            <a href="/fitness/cardio" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
              🏃‍♂️ <span className="font-semibold">Cardio Logs</span> <div className="text-sm text-gray-400">Runs, biking, rowing, etc.</div>
            </a>

            <a href="/fitness/sports" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
              🏀 <span className="font-semibold">Sports & Activities</span> <div className="text-sm text-gray-400">Games, hikes, other active things</div>
            </a>

            <a href="/fitness/stretching" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
              🧘 <span className="font-semibold">Stretching / Mobility</span> <div className="text-sm text-gray-400">Yoga, rehab, cooldowns</div>
            </a>

            <a href="/fitness/activity" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
              📱 <span className="font-semibold">Daily Activity</span> <div className="text-sm text-gray-400">Steps, mood, energy</div>
            </a>

            <a href="/fitness/planner" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
              📅 <span className="font-semibold">Plan Workouts</span> <div className="text-sm text-gray-400">Schedule fitness sessions</div>
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
