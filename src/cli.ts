#!/usr/bin/env node
/**
 * bluescape config set instance -n|name=us -d|domain=apps.us.bluescape.com Config instance
 * bluescape config switch instance us                                      Switch instance
 * bluescape login -u|email=sathish@bluescape.com                           Login
 * bluescape user get                                                     Get user list
 * bluescape user get userId                                                Get user By Id
 * bluescape delete user userId --force --new-owner-id=xx                   Delete user by user Id
 * bluescape delete user --from-file=xx.csv --new-owner-id=xx               Deletet user from csv file
 */

import { clear } from "console";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import handleError from "./handleError";

clear();
yargs(hideBin(process.argv))
  // Use the commands directory to scaffold.
  .commandDir("commands")
  // Default command if none supplied - shows help.
  .command(
    "$0",
    "The Bluescape CLI usage",
    () => undefined,
    () => {
      yargs.showHelp();
    }
  )
  // Enable strict mode.
  // .strict()
  // Useful aliases.  
  .alias({ h: "help" })
  // Be nice.
  .epilogue("For more information, check https://bluescape.com")
  // Handle failures.
  .fail(handleError).argv;
