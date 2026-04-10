import { CommandType } from './commandExecution';

/**
 * Maps Blockly block types to robot CommandTypes.
 * Only block types listed here will be accepted by the converter.
 */
const BLOCK_TYPE_TO_COMMAND: Record<string, CommandType> = {
  robot_forward:    'forward',
  robot_backward:   'backward',
  robot_turn_left:  'left',
  robot_turn_right: 'right',
  robot_wait:       'wait',
};

/** All supported Blockly block type strings. */
export const SUPPORTED_BLOCK_TYPES: string[] = Object.keys(BLOCK_TYPE_TO_COMMAND);

/**
 * Convert an ordered array of Blockly block type strings into robot commands.
 * Unknown block types are collected into `errors` and do not produce commands.
 *
 * This is a pure function so it can be tested without a live Blockly workspace.
 */
export function convertBlockTypesToCommands(blockTypes: string[]): {
  commands: CommandType[];
  errors: string[];
} {
  const commands: CommandType[] = [];
  const errors: string[] = [];

  for (const blockType of blockTypes) {
    const cmdType = BLOCK_TYPE_TO_COMMAND[blockType];
    if (cmdType !== undefined) {
      commands.push(cmdType);
    } else {
      errors.push(`Unsupported block type: "${blockType}"`);
    }
  }

  return { commands, errors };
}
