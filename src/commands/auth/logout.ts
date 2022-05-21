import type { Arguments, CommandBuilder } from "yargs";
import ora from "ora";
import { baseOptions, BaseOptions } from "../../shared";
import { deleteUserInfo } from "../../conf";
import { authService } from "../../services";
export type Options = BaseOptions & {
  username: string;
};
export type Builder = CommandBuilder<Options, Options>;

export type Handler = (argv: Arguments<Options>) => PromiseLike<void>;

export const command = "logout";
export const desc = "Bluescape Logout";

export const builder: Builder = (yargs) =>
  yargs.options({ ...baseOptions }).example([["$0 logout"]]);

export const handler = async (_argv: Arguments): Promise<void> => {
  const spinner = ora({
    isSilent: _argv.quiet as boolean,
  });
  spinner.start("Logout with Bluescape");
  try {
    deleteUserInfo();
    spinner.succeed(`User logged out successfully.`);
  } catch (error: any) {
    spinner.fail(error.message);
  }
};
