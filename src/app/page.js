'use client';

import AppBar from '@/components/AppBar';
import CalendarView from '@/components/CalendarView';

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <AppBar />

      <main className="flex flex-grow overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 bg-gray-800 p-6 overflow-auto">
          {/* Section Tiles */}
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

        {/* Right Content Area */}
        <section className="flex-grow bg-gray-900 p-8 overflow-auto">
            <CalendarView />
        </section>
      </main>
    </div>
  );
}
