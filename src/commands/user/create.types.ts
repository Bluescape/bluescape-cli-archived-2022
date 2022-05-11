// import type { EllipticCurveName } from 'openpgp';
import type { Arguments, CommandBuilder } from 'yargs';

import type { BaseOptions } from '../../shared';

export type Options = BaseOptions & {
  name: string | undefined;
  curve: null,
};

export type Builder = CommandBuilder<Options, Options>;

export type Handler = (argv: Arguments<Options>) => PromiseLike<void>;
