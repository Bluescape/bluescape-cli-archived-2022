import type { Arguments, CommandBuilder } from 'yargs';

export const command = 'siloeduserprovision <command>';
export const desc = 'set organization IDP and account';
export const builder: CommandBuilder = (yargs) =>
  yargs.commandDir('siloeduserprovision');
export const handler = (_argv: Arguments): void => {
  console.log('siloed user provisioning');
};
