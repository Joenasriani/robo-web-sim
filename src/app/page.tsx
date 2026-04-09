import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Hero section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 text-6xl">🤖</div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          RoboWebSim
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mb-3">
          A beginner-friendly, browser-based robotics simulator.
        </p>
        <p className="text-slate-400 max-w-xl mb-10">
          Control a robot in a 3D arena, complete guided lessons, and learn the fundamentals of autonomous navigation — all directly in your browser, no installation required.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/simulator"
            className="bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold px-8 py-4 rounded-xl transition-colors shadow-lg"
          >
            🚀 Launch Simulator
          </Link>
          <Link
            href="/lessons"
            className="bg-slate-700 hover:bg-slate-600 text-white text-lg font-bold px-8 py-4 rounded-xl transition-colors shadow-lg"
          >
            📚 Open Lessons
          </Link>
        </div>
      </section>

      {/* Features section */}
      <section className="bg-slate-800 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">What You Can Learn</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-700 rounded-xl p-6">
              <div className="text-3xl mb-3">🎮</div>
              <h3 className="text-lg font-semibold mb-2">Direct Control</h3>
              <p className="text-slate-400 text-sm">
                Use arrow keys or on-screen buttons to move and turn your robot in real-time. See how directional commands translate to movement.
              </p>
            </div>
            <div className="bg-slate-700 rounded-xl p-6">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="text-lg font-semibold mb-2">Command Queue</h3>
              <p className="text-slate-400 text-sm">
                Build a sequence of commands and run them automatically. This is your first step toward understanding autonomous robot behavior.
              </p>
            </div>
            <div className="bg-slate-700 rounded-xl p-6">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="text-lg font-semibold mb-2">Guided Lessons</h3>
              <p className="text-slate-400 text-sm">
                Follow step-by-step lessons designed for beginners. Complete objectives, track your progress, and build intuition for robotics concepts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-300">
            <div className="flex gap-4">
              <div className="text-2xl shrink-0">1️⃣</div>
              <div>
                <h3 className="font-semibold mb-1">Open the Simulator</h3>
                <p className="text-sm text-slate-400">A 3D arena loads with your robot, obstacles, and a target marker. No installation required.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl shrink-0">2️⃣</div>
              <div>
                <h3 className="font-semibold mb-1">Move Your Robot</h3>
                <p className="text-sm text-slate-400">Use the control panel or arrow keys to move forward, backward, turn left, and turn right.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl shrink-0">3️⃣</div>
              <div>
                <h3 className="font-semibold mb-1">Queue Commands</h3>
                <p className="text-sm text-slate-400">Add commands to a queue, then run them all at once. Watch your robot execute the planned path.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl shrink-0">4️⃣</div>
              <div>
                <h3 className="font-semibold mb-1">Complete Lessons</h3>
                <p className="text-sm text-slate-400">Follow the beginner lessons to learn navigation, turning, and obstacle avoidance concepts.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-800 py-6 text-center text-slate-500 text-sm border-t border-slate-700">
        <p>RoboWebSim — Browser-based robotics learning. Inspired by robotics simulation concepts.</p>
        <p className="mt-1">Built with Next.js, Three.js, and React Three Fiber.</p>
      </footer>
    </main>
  );
}
