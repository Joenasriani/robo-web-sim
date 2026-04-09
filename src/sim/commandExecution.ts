export type CommandType = 'forward' | 'backward' | 'left' | 'right' | 'wait';

export interface Command {
  id: string;
  type: CommandType;
  label: string;
}

export function createCommand(type: CommandType): Command {
  const labels: Record<CommandType, string> = {
    forward: '↑ Forward',
    backward: '↓ Backward',
    left: '← Turn Left',
    right: '→ Turn Right',
    wait: '⏸ Wait',
  };
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    label: labels[type],
  };
}
