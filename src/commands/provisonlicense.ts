import type { Arguments, CommandBuilder } from 'yargs';

export const command = 'provisionlicense <command>';
export const desc = 'set license purchased for legacy enterprise';
export const builder: CommandBuilder = (yargs) =>
  yargs.commandDir('provisionlicense');
export const handler = (_argv: Arguments): void => {
  console.log('provision license');
};
