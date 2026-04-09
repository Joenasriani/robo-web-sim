'use client';

import { useSimulatorStore, LessonStatus } from '@/sim/robotController';
import { FREE_PLAY_SCENARIOS } from '@/scenarios';

function TelRow({ label, value, color = 'text-slate-200' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500 shrink-0">{label}:</span>
      <span className={`font-mono text-right ${color}`}>{value}</span>
    </div>
  );
}

const SIM_STATE_LABELS: Record<string, string> = {
  idle: 'Idle',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  blocked: 'Blocked',
};

const SIM_STATE_COLORS: Record<string, string> = {
  idle: 'text-slate-400',
  running: 'text-green-400',
  paused: 'text-yellow-400',
  completed: 'text-green-300',
  blocked: 'text-red-400',
};

const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed:   'Completed',
  failed:      'Failed',
};

const LESSON_STATUS_COLORS: Record<LessonStatus, string> = {
  not_started: 'text-slate-500',
  in_progress: 'text-blue-400',
  completed:   'text-green-400',
  failed:      'text-red-400',
};

export default function TelemetryPanel() {
  const robot = useSimulatorStore((s) => s.robot);
  const commandQueue = useSimulatorStore((s) => s.commandQueue);
  const currentCommandIndex = useSimulatorStore((s) => s.currentCommandIndex);
  const simState = useSimulatorStore((s) => s.simState);
  const activeLesson = useSimulatorStore((s) => s.activeLesson);
  const lessonStatus = useSimulatorStore((s) => s.lessonStatus);
  const activeScenarioId = useSimulatorStore((s) => s.activeScenarioId);

  const currentCmd = currentCommandIndex !== null ? commandQueue[currentCommandIndex] : null;
  const remaining =
    currentCommandIndex !== null
      ? commandQueue.length - currentCommandIndex - 1
      : commandQueue.length;

  const headingDeg = (((robot.rotation * 180) / Math.PI) % 360 + 360) % 360;

  const isFreePlay = activeLesson === null;
  const currentScenario = isFreePlay
    ? FREE_PLAY_SCENARIOS.find((s) => s.id === activeScenarioId)
    : null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Telemetry</h3>
      <div className="bg-slate-900 rounded-lg p-2 text-xs space-y-1">
        <TelRow label="X" value={robot.position.x.toFixed(2)} />
        <TelRow label="Z" value={robot.position.z.toFixed(2)} />
        <TelRow label="Heading" value={`${headingDeg.toFixed(1)}°`} />
        <TelRow
          label="Sim State"
          value={SIM_STATE_LABELS[simState] ?? simState}
          color={SIM_STATE_COLORS[simState] ?? 'text-slate-400'}
        />
        <TelRow
          label="Mode"
          value={isFreePlay ? 'Free Play' : 'Lesson'}
          color={isFreePlay ? 'text-blue-400' : 'text-yellow-400'}
        />
        {isFreePlay && currentScenario && (
          <TelRow label="Scenario" value={currentScenario.title} />
        )}
        {!isFreePlay && activeLesson && (
          <TelRow
            label="Lesson"
            value={LESSON_STATUS_LABELS[lessonStatus]}
            color={LESSON_STATUS_COLORS[lessonStatus]}
          />
        )}
        <TelRow label="Command" value={currentCmd?.label ?? '—'} />
        <TelRow label="Remaining" value={`${remaining}`} />
        <div className="border-t border-slate-700 my-1" />
        <TelRow
          label="Collision"
          value={robot.health === 'hit_obstacle' ? '⚠ YES' : 'No'}
          color={robot.health === 'hit_obstacle' ? 'text-red-400' : 'text-slate-400'}
        />
        <TelRow
          label="At Target"
          value={robot.health === 'reached_target' ? '✓ YES' : 'No'}
          color={robot.health === 'reached_target' ? 'text-green-400' : 'text-slate-400'}
        />
        <div className="border-t border-slate-700 my-1" />
        <TelRow
          label="Front Dist"
          value={`${robot.sensors.frontDistance.toFixed(1)} m`}
          color={
            robot.sensors.frontDistance < 1.5
              ? 'text-red-400'
              : robot.sensors.frontDistance < 2.5
              ? 'text-yellow-400'
              : 'text-slate-200'
          }
        />
        <TelRow
          label="Left ⚠"
          value={robot.sensors.leftObstacle ? '⚠ Warn' : 'Clear'}
          color={robot.sensors.leftObstacle ? 'text-yellow-400' : 'text-slate-400'}
        />
        <TelRow
          label="Right ⚠"
          value={robot.sensors.rightObstacle ? '⚠ Warn' : 'Clear'}
          color={robot.sensors.rightObstacle ? 'text-yellow-400' : 'text-slate-400'}
        />
        <TelRow label="Target Dist" value={`${robot.sensors.targetDistance.toFixed(1)} m`} />
      </div>
    </div>
  );
}
