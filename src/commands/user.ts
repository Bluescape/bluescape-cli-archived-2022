import type { Arguments, CommandBuilder } from 'yargs';

export const command = 'user <command>';
export const desc = 'Manage user';
export const builder: CommandBuilder = (yargs) =>
  yargs.commandDir('user');
export const handler = (_argv: Arguments): void => { console.log('user')};
