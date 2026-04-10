'use client';

import { useSimulatorStore, LessonStatus, SimState } from '@/sim/robotController';
import { FREE_PLAY_SCENARIOS } from '@/scenarios';
import { LESSONS } from '@/lessons/lessonData';

const SIM_STATE_LABEL: Record<SimState, string> = {
  idle:      'Idle',
  running:   'Running',
  paused:    'Paused',
  completed: 'Completed',
  blocked:   'Blocked',
};

const SIM_STATE_COLOR: Record<SimState, string> = {
  idle:      'text-slate-400',
  running:   'text-green-400',
  paused:    'text-yellow-400',
  completed: 'text-green-300',
  blocked:   'text-red-400',
};

const LESSON_STATUS_LABEL: Record<LessonStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed:   'Completed',
  failed:      'Failed',
};

const LESSON_STATUS_BADGE: Record<LessonStatus, string> = {
  not_started: 'bg-slate-700 text-slate-400',
  in_progress: 'bg-blue-900/40 text-blue-300 border border-blue-700',
  completed:   'bg-green-900/40 text-green-300 border border-green-700',
  failed:      'bg-red-900/40 text-red-300 border border-red-700',
};

export default function CurrentContextPanel() {
  const activeLesson     = useSimulatorStore((s) => s.activeLesson);
  const activeScenarioId = useSimulatorStore((s) => s.activeScenarioId);
  const lessonStatus     = useSimulatorStore((s) => s.lessonStatus);
  const simState         = useSimulatorStore((s) => s.simState);

  const isFreePlay = activeLesson === null;

  const scenario = isFreePlay
    ? FREE_PLAY_SCENARIOS.find((s) => s.id === activeScenarioId) ?? null
    : null;
  const lesson = !isFreePlay
    ? LESSONS.find((l) => l.id === activeLesson) ?? null
    : null;

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 flex items-start justify-between gap-3 text-xs">
      {/* Left: mode + context title */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold uppercase tracking-wide text-[10px] px-1.5 py-0.5 rounded ${
              isFreePlay
                ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                : 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
            }`}
          >
            {isFreePlay ? 'Free Play' : 'Lesson'}
          </span>
          {!isFreePlay && lesson && (
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${LESSON_STATUS_BADGE[lessonStatus]}`}
            >
              {LESSON_STATUS_LABEL[lessonStatus]}
            </span>
          )}
        </div>

        {isFreePlay ? (
          <>
            <span className="text-white font-medium truncate">
              {scenario?.title ?? 'No Scenario'}
            </span>
            {scenario?.description && (
              <span className="text-slate-400 truncate max-w-[22ch]">
                {scenario.description}
              </span>
            )}
          </>
        ) : (
          <span className="text-white font-medium truncate">
            {lesson?.title ?? activeLesson ?? 'No Lesson'}
          </span>
        )}
      </div>

      {/* Right: sim state */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className="text-slate-500 text-[10px] uppercase tracking-wide">Sim State</span>
        <span className={`font-semibold ${SIM_STATE_COLOR[simState]}`}>
          {SIM_STATE_LABEL[simState]}
        </span>
      </div>
    </div>
  );
}
