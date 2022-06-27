import { Builder, Handler } from "./set.types";
import { askInstanceDetails } from "./ask-instance";
import { ConfigService } from "../../services/config.service";
import { addProfile } from "../../conf";
import chalk from "chalk";

export const command = "set [key]";
export const desc = "set [key]";

export const builder: Builder = (yargs) =>
  yargs.positional("key", { type: "string" }).example([
    // ['$0 config set'],
    ["$0 config set instance"],
  ]);

export const handler: Handler = async (argv) => {
  const { name, configUrl } = await askInstanceDetails();
  const {
    environment_config_url: config,
    isam,
    portal_api: portalApi,
    http_collaboration_service_address: collab,
    identity_api: identityApi,
  } = await new ConfigService().get(configUrl);
  addProfile({
    name,
    active: true,
    services: { config, isam, portalApi, collab, identityApi },
  });
  console.log(chalk.green(`${name} profile added`));
};
