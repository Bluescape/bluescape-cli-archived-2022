import ora from 'ora';

import { Builder, Handler } from './get.types';
import { baseOptions } from '../../shared';
import { askBluescapeCredentials } from '../login/get-credentials';

export const command = 'get [id]';
export const desc = 'get user';

export const builder: Builder = (yargs) =>
  yargs
    // .options({
    //   ...baseOptions,
    // })
    // .positional('name', { type: 'string' })
    .example([
      ['$0 user get'],
      ['$0 user get -l 100 -i 10'],
      ['$0 user get {id}'],
    ]);

export const handler: Handler = async (argv) => {
  console.log("vault addeddd",argv)
  const result = await askBluescapeCredentials('s');
  console.log("vault result",result)
};
