import type { Arguments, CommandBuilder } from "yargs";
import ora from "ora";
import { askBluescapeCredentials } from "./get-credentials";
import { baseOptions, BaseOptions } from "../../shared";
import { getServiceUrl } from "../../config";
import { Service } from "../../types";
import { AuthService } from "../../services/auth.service";
export type Options = BaseOptions & {
  username: string;
};
export type Builder = CommandBuilder<Options, Options>;

export type Handler = (argv: Arguments<Options>) => PromiseLike<void>;

export const command = "login [email]";
export const desc = "Bluescape Login";

export const builder: Builder = (yargs) =>
  yargs
    .options({ ...baseOptions })
    .positional("email", { type: "string" })
    .example([["$0 login"], ["$0 login {email}"]]);

export const handler = async (_argv: Arguments): Promise<void> => {
  const url = getServiceUrl(Service.ISAM);
  console.log(url);
  const spinner = ora({
    isSilent: _argv.quiet as boolean,
  });
  console.log(ora);
  const { email } = _argv;
  const { username, password } = await askBluescapeCredentials(email as string);
  spinner.start("Login with Bluescape");

  const token = await new AuthService().login(username, password);
  // console.log(username, password);
  console.log(token)
};
