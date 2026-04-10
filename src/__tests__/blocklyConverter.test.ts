import { convertBlockTypesToCommands, SUPPORTED_BLOCK_TYPES } from '@/sim/blocklyConverter';

describe('blocklyConverter', () => {
  describe('SUPPORTED_BLOCK_TYPES', () => {
    it('exports all 5 supported block types', () => {
      expect(SUPPORTED_BLOCK_TYPES).toHaveLength(5);
    });

    it('includes all expected block types', () => {
      expect(SUPPORTED_BLOCK_TYPES).toContain('robot_forward');
      expect(SUPPORTED_BLOCK_TYPES).toContain('robot_backward');
      expect(SUPPORTED_BLOCK_TYPES).toContain('robot_turn_left');
      expect(SUPPORTED_BLOCK_TYPES).toContain('robot_turn_right');
      expect(SUPPORTED_BLOCK_TYPES).toContain('robot_wait');
    });
  });

  describe('convertBlockTypesToCommands', () => {
    it('returns empty arrays for empty input', () => {
      const { commands, errors } = convertBlockTypesToCommands([]);
      expect(commands).toHaveLength(0);
      expect(errors).toHaveLength(0);
    });

    it('converts robot_forward to forward command', () => {
      const { commands, errors } = convertBlockTypesToCommands(['robot_forward']);
      expect(commands).toEqual(['forward']);
      expect(errors).toHaveLength(0);
    });

    it('converts robot_backward to backward command', () => {
      const { commands, errors } = convertBlockTypesToCommands(['robot_backward']);
      expect(commands).toEqual(['backward']);
      expect(errors).toHaveLength(0);
    });

    it('converts robot_turn_left to left command', () => {
      const { commands, errors } = convertBlockTypesToCommands(['robot_turn_left']);
      expect(commands).toEqual(['left']);
      expect(errors).toHaveLength(0);
    });

    it('converts robot_turn_right to right command', () => {
      const { commands, errors } = convertBlockTypesToCommands(['robot_turn_right']);
      expect(commands).toEqual(['right']);
      expect(errors).toHaveLength(0);
    });

    it('converts robot_wait to wait command', () => {
      const { commands, errors } = convertBlockTypesToCommands(['robot_wait']);
      expect(commands).toEqual(['wait']);
      expect(errors).toHaveLength(0);
    });

    it('converts all 5 supported block types in order', () => {
      const { commands, errors } = convertBlockTypesToCommands([
        'robot_forward',
        'robot_backward',
        'robot_turn_left',
        'robot_turn_right',
        'robot_wait',
      ]);
      expect(commands).toEqual(['forward', 'backward', 'left', 'right', 'wait']);
      expect(errors).toHaveLength(0);
    });

    it('converts a realistic multi-step sequence', () => {
      const { commands, errors } = convertBlockTypesToCommands([
        'robot_forward',
        'robot_forward',
        'robot_turn_right',
        'robot_forward',
        'robot_wait',
      ]);
      expect(commands).toEqual(['forward', 'forward', 'right', 'forward', 'wait']);
      expect(errors).toHaveLength(0);
    });

    it('reports an error for an unknown block type', () => {
      const { commands, errors } = convertBlockTypesToCommands(['unknown_block']);
      expect(commands).toHaveLength(0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('unknown_block');
    });

    it('skips unsupported blocks and still converts valid ones', () => {
      const { commands, errors } = convertBlockTypesToCommands([
        'robot_forward',
        'unknown_block',
        'robot_turn_left',
      ]);
      expect(commands).toEqual(['forward', 'left']);
      expect(errors).toHaveLength(1);
    });

    it('reports multiple errors for multiple unknown block types', () => {
      const { commands, errors } = convertBlockTypesToCommands([
        'bad_block_1',
        'robot_forward',
        'bad_block_2',
      ]);
      expect(commands).toEqual(['forward']);
      expect(errors).toHaveLength(2);
    });

    it('handles duplicate commands correctly', () => {
      const { commands, errors } = convertBlockTypesToCommands([
        'robot_forward',
        'robot_forward',
        'robot_forward',
      ]);
      expect(commands).toEqual(['forward', 'forward', 'forward']);
      expect(errors).toHaveLength(0);
    });

    it('handles a long sequence without errors', () => {
      const types = Array(20).fill('robot_wait');
      const { commands, errors } = convertBlockTypesToCommands(types);
      expect(commands).toHaveLength(20);
      expect(errors).toHaveLength(0);
    });
  });
});
