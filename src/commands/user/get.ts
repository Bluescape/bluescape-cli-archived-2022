import ora from "ora";
import validator from "validator";

import { Builder, Handler } from "./get.types";
import { userService } from "../../services";
import chalk from "chalk";

export const command = "get [id]";
export const desc = "get user by id/email";

export const builder: Builder = (yargs) =>
  yargs
    // .options({
    //   ...baseOptions,
    // })
    // .positional('name', { type: 'string' })
    .example([
      ["$0 user get"],
      ["$0 user get -l 100 -i 10"],
      ["$0 user get {id}"],
    ]);

export const handler: Handler = async (argv) => {
  const spinner = ora({
    isSilent: argv.quiet as boolean,
  });
  spinner.start(`user fetching`);
  let apiRes = null;

  const { id, attributes } = argv;
  const resAttriubutes = (attributes as string[]) || [
    "id",
    "firstName",
    "email",
    "lastName",
  ];
  const userKey = id as string;
  if (validator.isEmail(userKey as string)) {
    apiRes = await userService.getUserFromEmail(userKey, resAttriubutes);
  } else {
    apiRes = await userService.getUserById(userKey, resAttriubutes);
  }
  const { data: getRes, errors: getError } = apiRes;
  if (getError) {
    const [{ message }] = getError as any;
    spinner.fail(`User ${userKey} fetch failed. ${message}`);
  }
  spinner.succeed(chalk.green(JSON.stringify(getRes, null,2)));

};
