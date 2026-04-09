'use client';

import { useState } from 'react';
import { LESSONS } from '@/lessons/lessonData';
import { useSimulatorStore } from '@/sim/robotController';

export default function LessonsSidebar() {
  const [expandedLesson, setExpandedLesson] = useState<string | null>('lesson-1');
  const completedLessons = useSimulatorStore((s) => s.completedLessons);
  const robot = useSimulatorStore((s) => s.robot);
  const completeLesson = useSimulatorStore((s) => s.completeLesson);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Lessons</h3>
      {LESSONS.map((lesson) => {
        const isComplete = completedLessons.includes(lesson.id);
        const isExpanded = expandedLesson === lesson.id;
        const canComplete = robot.health === 'reached_target' && !isComplete;

        return (
          <div
            key={lesson.id}
            className={`rounded-lg border transition-colors ${
              isComplete
                ? 'border-green-700 bg-green-900/20'
                : isExpanded
                ? 'border-blue-600 bg-slate-800'
                : 'border-slate-700 bg-slate-800/50'
            }`}
          >
            <button
              className="w-full text-left px-3 py-2 flex items-center gap-2"
              onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
            >
              <span className={`text-base ${isComplete ? 'text-green-400' : 'text-slate-400'}`}>
                {isComplete ? '✅' : '📖'}
              </span>
              <span className={`text-sm font-medium ${isComplete ? 'text-green-300' : 'text-slate-200'}`}>
                {lesson.title}
              </span>
              <span className="ml-auto text-slate-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-2">
                <p className="text-xs text-slate-300">{lesson.objective}</p>

                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1">Steps:</p>
                  <ol className="space-y-1">
                    {lesson.steps.map((step, i) => (
                      <li key={i} className="text-xs text-slate-400 flex gap-2">
                        <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                        {step.instruction}
                      </li>
                    ))}
                  </ol>
                </div>

                <p className="text-xs text-slate-400">
                  <span className="text-yellow-400 font-semibold">✓ Success: </span>
                  {lesson.successCondition}
                </p>

                <p className="text-xs text-slate-500 italic">
                  💡 {lesson.hint}
                </p>

                {isComplete ? (
                  <div className="text-xs text-green-400 font-semibold bg-green-900/30 rounded px-2 py-1">
                    ✅ Lesson complete!
                  </div>
                ) : canComplete ? (
                  <button
                    onClick={() => completeLesson(lesson.id)}
                    className="btn-green text-xs w-full"
                  >
                    🎯 Mark as Complete
                  </button>
                ) : (
                  <p className="text-xs text-slate-500">Reach the target to complete this lesson.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
