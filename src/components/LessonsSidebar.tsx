'use client';

import { useSimulatorStore } from '@/sim/robotController';
import { LESSONS } from '@/lessons/lessonData';

export default function LessonsSidebar() {
  const completedLessons = useSimulatorStore((s) => s.completedLessons);
  const activeLesson = useSimulatorStore((s) => s.activeLesson);
  const robot = useSimulatorStore((s) => s.robot);
  const completeLesson = useSimulatorStore((s) => s.completeLesson);
  const setActiveLesson = useSimulatorStore((s) => s.setActiveLesson);
  const restartLesson = useSimulatorStore((s) => s.restartLesson);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Lessons</h3>
      {LESSONS.map((lesson, lessonIndex) => {
        const isComplete = completedLessons.includes(lesson.id);
        const isActive = activeLesson === lesson.id;
        const canComplete = robot.health === 'reached_target' && !isComplete;
        const nextLesson = LESSONS[lessonIndex + 1];

        return (
          <div
            key={lesson.id}
            className={`rounded-lg border transition-colors ${
              isComplete
                ? 'border-green-700 bg-green-900/20'
                : isActive
                ? 'border-blue-500 bg-slate-800'
                : 'border-slate-700 bg-slate-800/50'
            }`}
          >
            {/* Header */}
            <button
              className="w-full text-left px-3 py-2 flex items-center gap-2"
              onClick={() => setActiveLesson(isActive ? null : lesson.id)}
            >
              <span
                className={`text-base ${
                  isComplete ? 'text-green-400' : isActive ? 'text-blue-400' : 'text-slate-400'
                }`}
              >
                {isComplete ? '✅' : isActive ? '▶' : '📖'}
              </span>
              <span
                className={`text-xs font-medium ${
                  isComplete ? 'text-green-300' : isActive ? 'text-white' : 'text-slate-300'
                }`}
              >
                {lesson.title}
              </span>
              {isActive && !isComplete && (
                <span className="ml-auto text-blue-400 text-xs font-bold">ACTIVE</span>
              )}
              {isComplete && <span className="ml-auto text-green-400 text-xs">🏆</span>}
              {!isActive && !isComplete && (
                <span className="ml-auto text-slate-500 text-xs">▼</span>
              )}
            </button>

            {/* Expanded content */}
            {isActive && (
              <div className="px-3 pb-3 space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed">{lesson.objective}</p>

                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1">Steps:</p>
                  <ol className="space-y-1">
                    {lesson.steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-xs text-slate-400">
                        <span className="text-blue-400 font-bold shrink-0 w-4">{i + 1}.</span>
                        <span>{step.instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <p className="text-xs text-slate-400">
                  <span className="text-yellow-400 font-semibold">✓ Goal: </span>
                  {lesson.successCondition}
                </p>

                <p className="text-xs text-slate-500 italic">💡 {lesson.hint}</p>

                {isComplete ? (
                  <div className="space-y-1">
                    <div className="text-xs text-green-400 font-semibold bg-green-900/30 rounded px-2 py-1 text-center">
                      🏆 Lesson Complete!
                    </div>
                    {nextLesson && (
                      <button
                        onClick={() => setActiveLesson(nextLesson.id)}
                        className="btn-green text-xs w-full"
                      >
                        Next: {nextLesson.title.split(':')[0] ?? nextLesson.title.slice(0, 20)} →
                      </button>
                    )}
                    <button onClick={restartLesson} className="btn-secondary text-xs w-full">
                      🔄 Restart Lesson
                    </button>
                  </div>
                ) : canComplete ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => completeLesson(lesson.id)}
                      className="btn-green text-xs w-full"
                    >
                      🎯 Mark Complete!
                    </button>
                    <button onClick={restartLesson} className="btn-secondary text-xs w-full">
                      🔄 Restart
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Reach the target to complete.</p>
                    <button onClick={restartLesson} className="btn-secondary text-xs w-full">
                      🔄 Restart
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

