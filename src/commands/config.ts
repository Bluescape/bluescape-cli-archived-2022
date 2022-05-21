import chalk from "chalk";
import type { Arguments, CommandBuilder } from "yargs";

export const command = "config <command>";
export const desc = "configuration";
export const builder: CommandBuilder = (yargs) => yargs.commandDir("config");
export const handler = (_argv: Arguments): void => {
  console.log(chalk.red("Commmand not implemented"));
};
