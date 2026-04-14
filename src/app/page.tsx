import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen text-white flex flex-col" style={{ background: 'var(--rm-bg)' }}>
      {/* Hero section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Brand logo mark — replaces robot emoji */}
        <div className="mb-6 flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg" style={{ background: 'var(--rm-primary)' }} aria-label="RoboMarket robot logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" className="w-12 h-12" role="img" aria-label="Stylised robot icon">
            <title>Robot icon</title>
            <rect x="10" y="14" width="20" height="16" rx="3" fill="white" fillOpacity="0.9"/>
            <rect x="16" y="10" width="8" height="6" rx="2" fill="white" fillOpacity="0.7"/>
            <circle cx="15" cy="22" r="2.5" fill="var(--rm-primary)"/>
            <circle cx="25" cy="22" r="2.5" fill="var(--rm-primary)"/>
            <rect x="14" y="27" width="12" height="2" rx="1" fill="var(--rm-primary)" fillOpacity="0.7"/>
            <rect x="13" y="30" width="4" height="4" rx="1" fill="white" fillOpacity="0.8"/>
            <rect x="23" y="30" width="4" height="4" rx="1" fill="white" fillOpacity="0.8"/>
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #1d6ff4, #38bdf8)' }}>
          Robot Simulator
        </h1>
        <p className="text-xl max-w-2xl mb-3" style={{ color: 'var(--rm-text)' }}>
          A free learning tool by RoboMarket.ae
        </p>
        <p className="max-w-xl mb-10" style={{ color: 'var(--rm-text-muted)' }}>
          Control a robot in a 3D arena, complete guided lessons, and learn the fundamentals of autonomous navigation — all directly in your browser, no installation required.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/simulator"
            className="btn-primary"
          >
            Launch Simulator
          </Link>
          <Link
            href="/lessons"
            className="btn-outline"
          >
            View Lessons
          </Link>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 px-6" style={{ background: 'var(--rm-surface)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">What You Can Learn</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl p-6" style={{ background: 'var(--rm-surface-2)' }}>
              <div className="text-3xl mb-3">🎮</div>
              <h3 className="text-lg font-semibold mb-2">Direct Control</h3>
              <p className="text-sm" style={{ color: 'var(--rm-text-muted)' }}>
                Use arrow keys or on-screen buttons to move and turn your robot in real-time. See how directional commands translate to movement.
              </p>
            </div>
            <div className="rounded-xl p-6" style={{ background: 'var(--rm-surface-2)' }}>
              <div className="text-3xl mb-3">📋</div>
              <h3 className="text-lg font-semibold mb-2">Command Queue</h3>
              <p className="text-sm" style={{ color: 'var(--rm-text-muted)' }}>
                Build a sequence of commands and run them automatically. This is your first step toward understanding autonomous robot behavior.
              </p>
            </div>
            <div className="rounded-xl p-6" style={{ background: 'var(--rm-surface-2)' }}>
              <div className="text-3xl mb-3">📚</div>
              <h3 className="text-lg font-semibold mb-2">Guided Lessons</h3>
              <p className="text-sm" style={{ color: 'var(--rm-text-muted)' }}>
                Follow step-by-step lessons designed for beginners. Complete objectives, track your progress, and build intuition for robotics concepts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-16 px-6" style={{ background: 'var(--rm-bg)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ color: 'var(--rm-text)' }}>
            <div className="flex gap-4">
              <div className="text-2xl shrink-0">1️⃣</div>
              <div>
                <h3 className="font-semibold mb-1">Open the Simulator</h3>
                <p className="text-sm" style={{ color: 'var(--rm-text-muted)' }}>A 3D arena loads with your robot, obstacles, and a target marker. No installation required.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl shrink-0">2️⃣</div>
              <div>
                <h3 className="font-semibold mb-1">Move Your Robot</h3>
                <p className="text-sm" style={{ color: 'var(--rm-text-muted)' }}>Use the control panel or arrow keys to move forward, backward, turn left, and turn right.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl shrink-0">3️⃣</div>
              <div>
                <h3 className="font-semibold mb-1">Queue Commands</h3>
                <p className="text-sm" style={{ color: 'var(--rm-text-muted)' }}>Add commands to a queue, then run them all at once. Watch your robot execute the planned path.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl shrink-0">4️⃣</div>
              <div>
                <h3 className="font-semibold mb-1">Complete Lessons</h3>
                <p className="text-sm" style={{ color: 'var(--rm-text-muted)' }}>Follow the beginner lessons to learn navigation, turning, and obstacle avoidance concepts.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-6 text-center text-sm border-t" style={{ background: 'var(--rm-surface)', borderColor: 'var(--rm-border)', color: 'var(--rm-text-muted)' }}>
        <p>Free educational tool by RoboMarket.ae</p>
      </footer>
    </main>
  );
}
