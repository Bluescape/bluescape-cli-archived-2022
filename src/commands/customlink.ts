import type { Arguments, CommandBuilder } from 'yargs';

export const command = 'customlink <command>';
export const desc = 'Add/Update custom links to the user';
export const builder: CommandBuilder = (yargs) =>
  yargs.commandDir('customlink');
export const handler = (_argv: Arguments): void => { console.log('custom link')};
