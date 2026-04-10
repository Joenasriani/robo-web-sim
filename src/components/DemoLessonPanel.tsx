'use client';

import { useSimulatorStore, LessonStatus } from '@/sim/robotController';
import { LESSONS } from '@/lessons/lessonData';

const STATUS_LABEL: Record<LessonStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress ▶',
  completed:   '✅ Completed!',
  failed:      '❌ Failed — try again',
};

const STATUS_BG: Record<LessonStatus, string> = {
  not_started: 'bg-slate-700/60 border-slate-600',
  in_progress: 'bg-blue-900/40 border-blue-600',
  completed:   'bg-green-900/40 border-green-600',
  failed:      'bg-red-900/30 border-red-600',
};

const STATUS_TEXT: Record<LessonStatus, string> = {
  not_started: 'text-slate-400',
  in_progress: 'text-blue-300',
  completed:   'text-green-300',
  failed:      'text-red-300',
};

/**
 * Prominent lesson-context panel shown in Teacher / Demo Mode.
 * Displays lesson title, objective, hint, and live status in a large,
 * high-contrast format suitable for projection / classroom presentation.
 */
export default function DemoLessonPanel() {
  const activeLesson   = useSimulatorStore((s) => s.activeLesson);
  const lessonStatus   = useSimulatorStore((s) => s.lessonStatus);
  const authoredLessons = useSimulatorStore((s) => s.authoredLessons);
  const restartLesson  = useSimulatorStore((s) => s.restartLesson);
  const robot          = useSimulatorStore((s) => s.robot);
  const simState       = useSimulatorStore((s) => s.simState);

  if (!activeLesson) {
    return (
      <div className="mx-3 my-2 px-4 py-3 rounded-xl border border-slate-600 bg-slate-800/70 text-center">
        <p className="text-sm text-slate-400">
          🎓 <span className="font-semibold text-white">Demo Mode</span> — select a lesson from the left panel to begin.
        </p>
      </div>
    );
  }

  const lesson =
    LESSONS.find((l) => l.id === activeLesson) ??
    authoredLessons.find((l) => l.id === activeLesson);

  if (!lesson) return null;

  const isCustom = !LESSONS.some((l) => l.id === activeLesson);

  return (
    <div
      className={`mx-3 my-2 rounded-xl border ${STATUS_BG[lessonStatus]} px-4 py-3 space-y-2`}
      role="region"
      aria-label="Demo Mode lesson context"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          {isCustom && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-purple-800/60 text-purple-300 border border-purple-700">
              My Lesson
            </span>
          )}
          <h2 className="text-base font-bold text-white leading-tight truncate">
            {lesson.title}
          </h2>
        </div>
        {/* Live status badge */}
        <span
          className={`shrink-0 text-sm font-semibold ${STATUS_TEXT[lessonStatus]}`}
          aria-live="polite"
        >
          {STATUS_LABEL[lessonStatus]}
        </span>
      </div>

      {/* Objective */}
      <p className="text-sm text-slate-200 leading-relaxed">
        <span className="font-semibold text-yellow-300">🎯 Objective: </span>
        {lesson.objective}
      </p>

      {/* Hint */}
      {'hint' in lesson && lesson.hint && (
        <p className="text-sm text-slate-400 italic">
          💡 <span className="font-medium text-slate-300">Hint:</span> {lesson.hint}
        </p>
      )}

      {/* Live robot health / sim state */}
      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
        <span>
          Robot:{' '}
          <span className={
            robot.health === 'reached_target' ? 'text-green-400 font-semibold'
            : robot.health === 'hit_obstacle'  ? 'text-red-400 font-semibold'
            : 'text-slate-300'
          }>
            {robot.health === 'reached_target' ? '🎯 Target Reached!'
             : robot.health === 'hit_obstacle'  ? '💥 Hit Obstacle'
             : '✅ OK'}
          </span>
        </span>
        <span>
          State:{' '}
          <span className={
            simState === 'running'   ? 'text-green-400 font-semibold'
            : simState === 'paused'  ? 'text-yellow-400 font-semibold'
            : simState === 'blocked' ? 'text-red-400 font-semibold'
            : simState === 'completed' ? 'text-green-300 font-semibold'
            : 'text-slate-300'
          }>
            {simState.charAt(0).toUpperCase() + simState.slice(1)}
          </span>
        </span>
      </div>

      {/* Action row */}
      {(lessonStatus === 'completed' || lessonStatus === 'failed') && (
        <button
          onClick={restartLesson}
          className="mt-1 w-full text-sm font-semibold rounded-lg px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 transition-colors"
        >
          🔄 Restart Lesson
        </button>
      )}
    </div>
  );
}
