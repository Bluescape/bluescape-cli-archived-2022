import type { Arguments, CommandBuilder } from "yargs";
import { getUserInfo } from "../../conf";
import { BaseOptions } from "../../shared";

export type Options = BaseOptions & {
  username: string;
};
export type Builder = CommandBuilder<Options, Options>;

export type Handler = (argv: Arguments<Options>) => PromiseLike<void>;

export const command = "whoami";
export const desc = "show the current session user";

export const builder: Builder = (yargs) =>
  yargs
    // .options({ ...baseOptions })
    .example([["$0 whoami"]]);
export const handler = async (_argv: Arguments): Promise<void> => {
  const email = getUserInfo("email");
  console.log(`Logged user ${email}`);
};
