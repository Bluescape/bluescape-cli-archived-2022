import ora from "ora";
import validator from "validator";

import { Builder, Handler } from "./get.types";
import { baseOptions } from "../../shared";
import { askBluescapeCredentials } from "../auth/ask-credentials";
import { userService } from "../../services";
import { getJsonFromCSV } from "../../utils/csv";
import chalk from "chalk";

export const command = "delete [id]";
export const desc = "delete user id or csv file";

export const builder: Builder = (yargs) =>
  yargs
    // .options({
    //   ...baseOptions,
    // })
    // .positional('name', { type: 'string' })
    .example([
      // ["$0 user delete {id} --new-owner-id=xx"],
      // ["$0 user delete {id} --new-owner-id=xx --force"],
      ["$0 user delete --from-csv=xx.csv  --new-owner-id=xx --force"],
    ]);

export const handler: Handler = async (argv) => {
  const { fromCsv, newOwnerId, force } = argv;
  const ownerId = newOwnerId as string;
  const hardDelte = !!force;
  if (!ownerId) {
    throw new Error("New worksapce owner Id not proivided --new-owner-id=xx");
  }
  await userService.validateUser(ownerId);
  if (!fromCsv) {
    throw new Error("CSV file path not proivided --from-csv=yy.csv");
  }
  const spinner = ora({
    isSilent: argv.quiet as boolean,
  });

  const users = await getJsonFromCSV(fromCsv as string);
  const faildCsv = [] as any[];
  const emailErrror = (email: string, message: string) => {
    faildCsv.push({ email, message });
    spinner.fail(`User ${email} deletion failed. ${message}`);
  };
  let i = 0;
  for (const user of users) {
    i++;
    const { email } = user;
    spinner.start(`${i}/${users.length} :  ${email} is processing..`);
    if (validator.isEmail(email)) {
      const { data: getRes, errors: getError } =
        await userService.getUserFromEmail(email, ["id"]);
      if (getError) {
        const [{ message }] = getError as any;
        emailErrror(email, message);
      } else {
        const {
          user: { id: userId },
        } = getRes as any;
        const { data: delRes, errors: delErr } =
          await userService.deleteUserViaGL(userId, ownerId, hardDelte);
        if (delErr) {
          const [{ message }] = delErr as any;
          emailErrror(email, message);
        } else {
          spinner.succeed(`User ${email} deleted`);
        }
      }
    } else {
      emailErrror(email, "Invalid Email Format");
    }
  }

  if (faildCsv.length === 0) {
    spinner.succeed(
      chalk.green(`AllCSV file users deleted, Total user count ${users.length}`)
    );
  } else {
    spinner.fail(
      chalk.yellow(
        `${users.length - faildCsv.length} users deleted succesfully and ${
          faildCsv.length
        } users deletion faild`
      )
    );
  }
};
