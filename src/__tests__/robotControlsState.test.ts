import { getQueueControlUiState } from '@/components/RobotControls';

describe('RobotControls queue UI state', () => {
  it('disables Play and explains why when queue is empty', () => {
    const ui = getQueueControlUiState({
      simState: 'idle',
      queueLength: 0,
      isRunningQueue: false,
      isPaused: false,
    });

    expect(ui.canPlay).toBe(false);
    expect(ui.playTitle).toContain('Queue is empty');
    expect(ui.helperText).toContain('Queue is empty');
  });

  it('enables Play when queue exists and queue is not running (including blocked/completed states)', () => {
    const blockedUi = getQueueControlUiState({
      simState: 'blocked',
      queueLength: 2,
      isRunningQueue: false,
      isPaused: false,
    });
    const completedUi = getQueueControlUiState({
      simState: 'completed',
      queueLength: 2,
      isRunningQueue: false,
      isPaused: false,
    });

    expect(blockedUi.canPlay).toBe(true);
    expect(completedUi.canPlay).toBe(true);
  });

  it('shows Pause while running, and Resume while paused', () => {
    const runningUi = getQueueControlUiState({
      simState: 'running',
      queueLength: 3,
      isRunningQueue: true,
      isPaused: false,
    });
    const pausedUi = getQueueControlUiState({
      simState: 'paused',
      queueLength: 3,
      isRunningQueue: true,
      isPaused: true,
    });

    expect(runningUi.pauseLabel).toBe('⏸ Pause');
    expect(pausedUi.pauseLabel).toBe('▶ Resume');
    expect(runningUi.canStop).toBe(true);
    expect(pausedUi.canStop).toBe(true);
  });
});
