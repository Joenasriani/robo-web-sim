'use client';

import { useState } from 'react';
import { useSimulatorStore, LessonStatus } from '@/sim/robotController';
import { LESSONS } from '@/lessons/lessonData';
import type { AuthoredLesson } from '@/sim/authoredLessons';

const STATUS_LABEL: Record<LessonStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed:   'Completed',
  failed:      'Failed',
};

const STATUS_COLOR: Record<LessonStatus, string> = {
  not_started: 'text-slate-500',
  in_progress: 'text-blue-400',
  completed:   'text-green-400',
  failed:      'text-red-400',
};

const STATUS_DOT: Record<LessonStatus, string> = {
  not_started: 'bg-slate-600',
  in_progress: 'bg-blue-500',
  completed:   'bg-green-500',
  failed:      'bg-red-500',
};

// ---------------------------------------------------------------------------
// Authored lesson row
// ---------------------------------------------------------------------------

function AuthoredLessonRow({
  lesson,
  isActive,
  lessonStatus,
  onLoad,
  onRename,
  onDelete,
  onRestart,
}: {
  lesson: AuthoredLesson;
  isActive: boolean;
  lessonStatus: LessonStatus;
  onLoad: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onRestart: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(lesson.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function submitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== lesson.title) onRename(lesson.id, trimmed);
    setRenaming(false);
  }

  const status: LessonStatus = isActive ? lessonStatus : 'not_started';

  return (
    <div className={`rounded-lg border transition-colors ${
      isActive ? 'border-purple-500 bg-slate-800' : 'border-slate-700 bg-slate-800/50'
    }`}>
      <button
        className="w-full text-left px-3 py-2 flex items-center gap-2"
        onClick={() => !isActive && onLoad(lesson.id)}
        aria-label={`Load authored lesson: ${lesson.title}`}
      >
        <span className="text-base">{isActive ? '▶' : '📝'}</span>
        <span className={`text-xs font-medium flex-1 truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
          {lesson.title}
        </span>
        {isActive && (
          <span className="ml-auto text-purple-400 text-xs font-bold shrink-0">ACTIVE</span>
        )}
        {!isActive && (
          <span className="ml-auto text-slate-500 text-xs shrink-0">▶ Load</span>
        )}
      </button>

      {isActive && (
        <div className="px-3 pb-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
            <span className={`text-xs font-semibold ${STATUS_COLOR[status]}`}>
              {STATUS_LABEL[status]}
            </span>
          </div>

          {lesson.objective && (
            <p className="text-xs text-slate-300 leading-relaxed">{lesson.objective}</p>
          )}

          {lesson.completionRules && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">Rules:</p>
              <ul className="space-y-0.5">
                {lesson.completionRules.reachTarget && (
                  <li className="text-xs text-slate-400">○ Reach the target</li>
                )}
                {lesson.completionRules.avoidCollision && (
                  <li className="text-xs text-slate-400">○ Avoid all obstacles</li>
                )}
                {lesson.completionRules.makeAtLeastOneTurn && (
                  <li className="text-xs text-slate-400">○ Turn at least once</li>
                )}
                {lesson.completionRules.completeQueue && (
                  <li className="text-xs text-slate-400">○ Complete the queue</li>
                )}
              </ul>
            </div>
          )}

          {lesson.hint && (
            <p className="text-xs text-slate-500 italic">💡 {lesson.hint}</p>
          )}

          {(status === 'completed' || status === 'failed') && (
            <button onClick={onRestart} className="btn-secondary text-xs w-full">
              🔄 Restart
            </button>
          )}
          {status === 'in_progress' && (
            <button onClick={onRestart} className="btn-secondary text-xs w-full">
              🔄 Restart
            </button>
          )}
        </div>
      )}

      {/* Management row */}
      <div className="px-3 pb-2 flex gap-1">
        {!renaming && !confirmDelete && (
          <>
            <button
              onClick={() => { setRenameValue(lesson.title); setRenaming(true); }}
              className="btn-small text-xs shrink-0"
              title="Rename"
              aria-label={`Rename lesson: ${lesson.title}`}
            >
              ✏️
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="btn-small text-xs shrink-0 text-red-400 hover:text-red-300"
              title="Delete"
              aria-label={`Delete lesson: ${lesson.title}`}
            >
              🗑️
            </button>
          </>
        )}

        {renaming && (
          <div className="flex gap-1 flex-1">
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') setRenaming(false);
              }}
              className="flex-1 text-xs rounded bg-slate-700 border border-slate-600 text-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
              maxLength={80}
              aria-label="New lesson title"
            />
            <button onClick={submitRename} className="btn-small shrink-0" aria-label="Confirm rename">✓</button>
            <button onClick={() => setRenaming(false)} className="btn-small shrink-0" aria-label="Cancel rename">✕</button>
          </div>
        )}

        {confirmDelete && (
          <div className="flex gap-1 flex-1 items-center">
            <span className="text-[10px] text-red-400 flex-1">Delete?</span>
            <button
              onClick={() => { onDelete(lesson.id); setConfirmDelete(false); }}
              className="btn-small text-xs text-red-400 hover:text-red-300 shrink-0"
              aria-label="Confirm delete"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="btn-small text-xs shrink-0"
              aria-label="Cancel delete"
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main sidebar
// ---------------------------------------------------------------------------

export default function LessonsSidebar() {
  const completedLessons      = useSimulatorStore((s) => s.completedLessons);
  const activeLesson          = useSimulatorStore((s) => s.activeLesson);
  const lessonStatus          = useSimulatorStore((s) => s.lessonStatus);
  const hasTurned             = useSimulatorStore((s) => s.hasTurned);
  const robot                 = useSimulatorStore((s) => s.robot);
  const completeLesson        = useSimulatorStore((s) => s.completeLesson);
  const setActiveLesson       = useSimulatorStore((s) => s.setActiveLesson);
  const restartLesson         = useSimulatorStore((s) => s.restartLesson);
  const authoredLessons       = useSimulatorStore((s) => s.authoredLessons);
  const loadAuthoredLesson    = useSimulatorStore((s) => s.loadAuthoredLesson);
  const renameAuthoredLesson  = useSimulatorStore((s) => s.renameAuthoredLesson);
  const deleteAuthoredLesson  = useSimulatorStore((s) => s.deleteAuthoredLesson);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Lessons</h3>
      {!activeLesson && (
        <p className="text-xs text-slate-500 italic leading-relaxed">
          Select a lesson below to begin guided practice.
        </p>
      )}
      {LESSONS.map((lesson, lessonIndex) => {
        const isComplete = completedLessons.includes(lesson.id);
        const isActive = activeLesson === lesson.id;
        const canComplete = robot.health === 'reached_target' && !isComplete;
        const nextLesson = LESSONS[lessonIndex + 1];
        // Resolve the current status for this lesson card
        const status: LessonStatus = isActive ? lessonStatus : isComplete ? 'completed' : 'not_started';

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
                {/* Lesson status badge */}
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
                  <span className={`text-xs font-semibold ${STATUS_COLOR[status]}`}>
                    {STATUS_LABEL[status]}
                  </span>
                </div>

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

                {lesson.completionRules && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">Rules:</p>
                    <ul className="space-y-0.5">
                      {lesson.completionRules.reachTarget && (
                        <li className="text-xs text-slate-400 flex items-center gap-1">
                          <span className={robot.health === 'reached_target' ? 'text-green-400' : 'text-slate-500'}>
                            {robot.health === 'reached_target' ? '✓' : '○'}
                          </span> Reach the target
                        </li>
                      )}
                      {lesson.completionRules.avoidCollision && (
                        <li className="text-xs text-slate-400 flex items-center gap-1">
                          <span className={robot.health === 'hit_obstacle' ? 'text-red-400' : 'text-slate-500'}>
                            {robot.health === 'hit_obstacle' ? '✗' : '○'}
                          </span> Avoid all obstacles
                        </li>
                      )}
                      {lesson.completionRules.makeAtLeastOneTurn && (
                        <li className="text-xs text-slate-400 flex items-center gap-1">
                          <span className={hasTurned ? 'text-green-400' : 'text-slate-500'}>
                            {hasTurned ? '✓' : '○'}
                          </span> Turn at least once
                        </li>
                      )}
                      {lesson.completionRules.completeQueue && (
                        <li className="text-xs text-slate-400 flex items-center gap-1">
                          <span className="text-slate-500">○</span> Complete the queue
                        </li>
                      )}
                    </ul>
                  </div>
                )}

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
                ) : status === 'failed' ? (
                  <div className="space-y-1">
                    <div className="text-xs text-red-400 font-semibold bg-red-900/20 rounded px-2 py-1 text-center">
                      ❌ Lesson Failed — try again!
                    </div>
                    <button onClick={restartLesson} className="btn-secondary text-xs w-full">
                      🔄 Restart
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

      {/* My Lessons (authored) section */}
      {authoredLessons.length > 0 && (
        <>
          <hr className="border-slate-700 mt-1" />
          <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wide flex items-center gap-1">
            📝 My Lessons
          </h3>
          <p className="text-[10px] text-slate-500 leading-snug -mt-2">
            Custom lessons you have authored. Use the &ldquo;Author a Lesson&rdquo; panel to create more.
          </p>
          {authoredLessons.map((lesson) => {
            const isActive = activeLesson === lesson.id;
            return (
              <AuthoredLessonRow
                key={lesson.id}
                lesson={lesson}
                isActive={isActive}
                lessonStatus={isActive ? lessonStatus : 'not_started'}
                onLoad={loadAuthoredLesson}
                onRename={renameAuthoredLesson}
                onDelete={deleteAuthoredLesson}
                onRestart={restartLesson}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

