import ora from 'ora';

import { Builder, Handler } from './create.types';
import { baseOptions } from '../../shared';
import { askBluescapeCredentials } from '../login/get-credentials';

export const command = 'get [name]';
export const desc = 'get user';

export const builder: Builder = (yargs) =>
  yargs
    // .options({
    //   ...baseOptions,
    // })
    // .positional('name', { type: 'string' })
    .example([
      ['$0 vault create'],
      ['$0 vault create devs'],
      ['$0 vault create creds:aws -c secp256k1 --profile project:phoenix'],
      ['$0 vault create creds:aws -q --json | jq -r .VaultId | pbcopy'],
    ]);

export const handler: Handler = async (argv) => {
  console.log("vault addeddd",argv)
  const result = await askBluescapeCredentials('s');
  console.log("vault result",result)
};
