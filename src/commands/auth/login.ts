import type { Arguments, CommandBuilder } from "yargs";
import ora from "ora";
import { askBluescapeCredentials } from "./ask-credentials";
import { baseOptions, BaseOptions } from "../../shared";
import { getServiceUrl, setUserInfo } from "../../conf";
import { Service } from "../../types";
import { authService, userService } from "../../services";
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
  const spinner = ora({
    isSilent: _argv.quiet as boolean,
  });
  const { email } = _argv;
  const { username, password } = await askBluescapeCredentials(email as string);
  spinner.start("Login with Bluescape");
  try {
    const token = await authService.login(username, password);
    spinner.succeed("Login Success");
    setUserInfo({ token, email: username });
    spinner.start("Fetching user infomation");
    const { id, firstName, lastName } =
    await  userService.getSessionUser();
    setUserInfo({ id, firstName, lastName });
    spinner.succeed(`User ${firstName} ${lastName} Logged`);
  } catch (error: any) {
    spinner.fail(error.message);
  }
};
