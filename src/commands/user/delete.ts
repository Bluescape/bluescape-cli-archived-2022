import ora from "ora";

import { Builder, Handler } from "./get.types";
import { baseOptions } from "../../shared";
import { askBluescapeCredentials } from "../login/get-credentials";

export const command = "delete [id]";
export const desc = "delete user id or csv file";

export const builder: Builder = (yargs) =>
  yargs
    // .options({
    //   ...baseOptions,
    // })
    // .positional('name', { type: 'string' })
    .example([
      ["$0 user delete {id} --new-owner-id=xx"],
      ["$0 user delete {id} --new-owner-id=xx --force"],
      ["$0 user delete --from-file=xx.csv  --new-owner-id=xx"],
    ]);

export const handler: Handler = async (argv) => {
  console.log("user delete", argv);
};
