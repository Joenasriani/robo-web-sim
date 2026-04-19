'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LESSONS } from '@/lessons/lessonData';
import { useSimulatorStore } from '@/sim/robotController';

const LESSON_PROGRESS_KEY = 'robo-web-sim:lesson-progress';

function readLessonProgressCount(): number {
  try {
    const raw = localStorage.getItem(LESSON_PROGRESS_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export default function LessonsPage() {
  const completedLessons = useSimulatorStore((s) => s.completedLessons);
  const resetProgress = useSimulatorStore((s) => s.resetLessonProgress);
  const [lessonProgressCount, setLessonProgressCount] = useState(() =>
    typeof window === 'undefined' ? 0 : readLessonProgressCount(),
  );

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== LESSON_PROGRESS_KEY) return;
      setLessonProgressCount(readLessonProgressCount());
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleResetProgress = () => {
    if (!window.confirm('Reset all lesson progress? This cannot be undone.')) return;
    resetProgress();
    localStorage.removeItem(LESSON_PROGRESS_KEY);
    setLessonProgressCount(0);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">← Back to Home</Link>
        <h1 className="text-xl font-bold">📚 Lessons</h1>
        <Link href="/simulator" className="text-blue-400 hover:text-blue-300 text-sm">Open Simulator →</Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Beginner Lessons</h2>
            <p className="text-slate-400 mt-1">Learn the fundamentals of robot navigation step by step.</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-300">
              {lessonProgressCount}/{LESSONS.length} complete
            </div>
            <button
              onClick={handleResetProgress}
              className="text-xs text-red-400 hover:text-red-300 mt-1 underline"
            >
              Reset progress
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(lessonProgressCount / LESSONS.length) * 100}%` }}
            />
          </div>

        {/* Lessons */}
        <div className="space-y-6">
          {LESSONS.map((lesson, index) => {
            const isComplete = completedLessons.includes(lesson.id);
            return (
              <div
                key={lesson.id}
                className={`rounded-xl border p-6 ${
                  isComplete
                    ? 'border-green-600 bg-green-900/20'
                    : 'border-slate-700 bg-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span>{isComplete ? '✅' : `${index + 1}.`}</span>
                    {lesson.title}
                  </h3>
                  {isComplete && (
                    <span className="text-green-400 text-sm font-semibold">Completed!</span>
                  )}
                </div>

                <p className="text-slate-300 mb-4">{lesson.objective}</p>

                <div className="space-y-2 mb-4">
                  <p className="text-sm font-semibold text-slate-400">Steps:</p>
                  <ol className="space-y-2">
                    {lesson.steps.map((step, i) => (
                      <li key={i} className="text-sm text-slate-400 flex gap-3">
                        <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                        {step.instruction}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
                  <p className="text-sm text-slate-300">
                    <span className="text-yellow-400 font-semibold">✓ Success: </span>
                    {lesson.successCondition}
                  </p>
                  <p className="text-sm text-slate-400 italic">💡 Hint: {lesson.hint}</p>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/simulator?lesson=${index + 1}`}
                    className="inline-block bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
                  >
                    Practice in Simulator →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
