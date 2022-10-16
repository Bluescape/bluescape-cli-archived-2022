import type { Arguments, CommandBuilder } from 'yargs';

export const command = 'emailmigration <command>';
export const desc = 'Migrate email address of the user to SSO domain';
export const builder: CommandBuilder = (yargs) =>
  yargs.commandDir('emailmigration');
export const handler = (_argv: Arguments): void => { console.log('email migration')};
