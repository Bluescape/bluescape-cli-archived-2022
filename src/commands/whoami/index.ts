import type { Arguments, CommandBuilder } from 'yargs';
import chalk from 'chalk';
import { getActiveProfile, getUserInfo } from '../../conf';
import { BaseOptions } from '../../shared';

export type Options = BaseOptions & {
  username: string;
};
export type Builder = CommandBuilder<Options, Options>;

export type Handler = (argv: Arguments<Options>) => PromiseLike<void>;

export const command = 'whoami';
export const desc = 'show session user';

export const builder: Builder = (yargs) =>
  yargs
    // .options({ ...baseOptions })
    .example([['$0 whoami']]);
export const handler = async (_argv: Arguments): Promise<void> => {
  const {
    name,
    user: { email, firstName, lastName },
    services: { configuration: config },
  } = getActiveProfile();
  if (!name) {
    console.log(chalk.red(`Active profile not found`));
  } else {
    console.log(chalk.green(`Instance Name: ${name}, Config: ${config} `));
    if (!email) {
      console.log(chalk.red(`User not logged`));
    } else {
      console.log(
        chalk.green(`Logged user ${firstName} ${lastName} (${email}).`)
      );
    }
  }
};
