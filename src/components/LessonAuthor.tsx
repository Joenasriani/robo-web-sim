'use client';

import { useState } from 'react';
import { useSimulatorStore } from '@/sim/robotController';
import type { CompletionRules } from '@/lessons/lessonData';
import type { ArenaOverrides } from '@/sim/arenaConfig';
import type { LessonStartPose } from '@/lessons/lessonData';

interface AuthorForm {
  title: string;
  objective: string;
  hint: string;
}

const EMPTY_FORM: AuthorForm = { title: '', objective: '', hint: '' };

export default function LessonAuthor() {
  const robot  = useSimulatorStore((s) => s.robot);
  const arena  = useSimulatorStore((s) => s.arena);
  const saveAuthoredLesson = useSimulatorStore((s) => s.saveAuthoredLesson);

  const [form, setForm] = useState<AuthorForm>(EMPTY_FORM);
  const [rules, setRules] = useState<CompletionRules>({ reachTarget: true });
  const [capturedPose, setCapturedPose] = useState<LessonStartPose | null>(null);
  const [capturedArena, setCapturedArena] = useState<ArenaOverrides | null>(null);
  const [saved, setSaved] = useState(false);

  function captureCurrentPose() {
    setCapturedPose({
      position: { ...robot.position },
      rotation: robot.rotation,
    });
  }

  function captureCurrentArena() {
    setCapturedArena({
      obstacles: arena.obstacles.map((o) => ({ ...o, position: [...o.position] as [number, number, number], size: [...o.size] as [number, number, number] })),
      targets:   arena.targets.map((t) => ({ ...t, position: [...t.position] as [number, number, number] })),
    });
  }

  function clearCaptures() {
    setCapturedPose(null);
    setCapturedArena(null);
  }

  function toggleRule(key: keyof CompletionRules) {
    setRules((r) => ({ ...r, [key]: !r[key] }));
  }

  function handleSave() {
    const trimTitle     = form.title.trim();
    const trimObjective = form.objective.trim();
    const trimHint      = form.hint.trim();
    if (!trimTitle) return;

    const activeRules: CompletionRules = {};
    for (const key of Object.keys(rules) as Array<keyof CompletionRules>) {
      if (rules[key]) activeRules[key] = true;
    }
    if (Object.keys(activeRules).length === 0) {
      activeRules.reachTarget = true; // guarantee at least one rule
    }

    saveAuthoredLesson({
      title:            trimTitle,
      objective:        trimObjective || trimTitle,
      hint:             trimHint || 'Use the movement controls to complete the objective.',
      successCondition: buildSuccessCondition(activeRules),
      steps: [
        { instruction: trimObjective || 'Complete the lesson objective.' },
      ],
      completionRules: activeRules,
      ...(capturedPose  ? { startPose:      capturedPose  } : {}),
      ...(capturedArena ? { arenaOverrides: capturedArena } : {}),
    });

    // Reset form
    setForm(EMPTY_FORM);
    setRules({ reachTarget: true });
    setCapturedPose(null);
    setCapturedArena(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const canSave = form.title.trim().length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div>
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Author a Lesson
        </h3>
        <p className="text-[10px] text-slate-600 leading-snug">
          Create a custom lesson from the current arena and robot position.
        </p>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-slate-400 font-medium">Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. My First Custom Lesson"
          maxLength={80}
          className="text-xs rounded bg-slate-700 border border-slate-600 text-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
          aria-label="Lesson title"
        />
      </div>

      {/* Objective */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-slate-400 font-medium">Objective</label>
        <input
          type="text"
          value={form.objective}
          onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
          placeholder="What should the learner do?"
          maxLength={200}
          className="text-xs rounded bg-slate-700 border border-slate-600 text-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
          aria-label="Lesson objective"
        />
      </div>

      {/* Hint */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-slate-400 font-medium">Hint</label>
        <input
          type="text"
          value={form.hint}
          onChange={(e) => setForm((f) => ({ ...f, hint: e.target.value }))}
          placeholder="A helpful tip for learners"
          maxLength={200}
          className="text-xs rounded bg-slate-700 border border-slate-600 text-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
          aria-label="Lesson hint"
        />
      </div>

      {/* Completion rules */}
      <div className="flex flex-col gap-1">
        <p className="text-[10px] text-slate-400 font-medium">Success rules (AND)</p>
        <div className="flex flex-col gap-0.5">
          {RULE_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!rules[key]}
                onChange={() => toggleRule(key)}
                className="accent-blue-500 w-3 h-3 shrink-0"
                aria-label={label}
              />
              <span className="text-[10px] text-slate-400 leading-tight">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Capture buttons */}
      <div className="flex flex-col gap-1">
        <p className="text-[10px] text-slate-400 font-medium">Capture (optional)</p>
        <div className="flex gap-1">
          <button
            onClick={captureCurrentPose}
            className={`btn-small flex-1 text-left text-[10px] ${capturedPose ? 'ring-1 ring-green-500' : ''}`}
            title="Capture the robot's current position and rotation as the lesson start pose"
          >
            {capturedPose ? '✅ Pose' : '📍 Capture Pose'}
          </button>
          <button
            onClick={captureCurrentArena}
            className={`btn-small flex-1 text-left text-[10px] ${capturedArena ? 'ring-1 ring-green-500' : ''}`}
            title="Capture the current arena layout (obstacles and targets) for this lesson"
          >
            {capturedArena ? '✅ Arena' : '🗺️ Capture Arena'}
          </button>
          {(capturedPose || capturedArena) && (
            <button
              onClick={clearCaptures}
              className="btn-small shrink-0 text-[10px] text-slate-400"
              title="Clear captured pose and arena"
              aria-label="Clear captures"
            >
              ✕
            </button>
          )}
        </div>
        {capturedPose && (
          <p className="text-[10px] text-green-400 leading-snug">
            Start pose captured — robot at ({capturedPose.position.x.toFixed(1)}, {capturedPose.position.z.toFixed(1)})
          </p>
        )}
        {capturedArena && (
          <p className="text-[10px] text-green-400 leading-snug">
            Arena captured — {capturedArena.obstacles?.length ?? 0} obstacle{capturedArena.obstacles?.length !== 1 ? 's' : ''},{' '}
            {capturedArena.targets?.length ?? 0} target{capturedArena.targets?.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!canSave}
        className="btn-green text-xs w-full disabled:opacity-50"
        aria-label="Save custom lesson"
      >
        {saved ? '✅ Lesson Saved!' : '✏️ Save Lesson'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RULE_OPTIONS: Array<{ key: keyof CompletionRules; label: string }> = [
  { key: 'reachTarget',        label: 'Reach the target'     },
  { key: 'avoidCollision',     label: 'Avoid all obstacles'  },
  { key: 'makeAtLeastOneTurn', label: 'Turn at least once'   },
  { key: 'completeQueue',      label: 'Complete the queue'   },
];

function buildSuccessCondition(rules: CompletionRules): string {
  const parts: string[] = [];
  if (rules.reachTarget)        parts.push('reach the target');
  if (rules.avoidCollision)     parts.push('avoid all obstacles');
  if (rules.makeAtLeastOneTurn) parts.push('make at least one turn');
  if (rules.completeQueue)      parts.push('complete the command queue');
  if (parts.length === 0) return 'Complete the objective.';
  return parts.map((p, i) => (i === 0 ? p[0].toUpperCase() + p.slice(1) : p)).join(', ') + '.';
}
