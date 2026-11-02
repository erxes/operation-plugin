import { resolve } from 'node:path';

import { composePlugins, withNx, withReact } from '@nx/rspack';
import { withModuleFederation } from '@nx/rspack/module-federation';

import baseConfig from './module-federation.config';

const config = {
  ...baseConfig,
};

export default composePlugins(
  withNx(),
  withReact(),
  withModuleFederation(config, { dts: false }),
  (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '~': resolve(__dirname, 'src'),
      '@': resolve(__dirname, 'src/modules'),
      // @erxes/ui ships built JS (no src/); deep imports resolve from the root.
      'erxes-ui': resolve(__dirname, 'node_modules/erxes-ui'),
      'ui-modules': resolve(__dirname, 'node_modules/ui-modules/src'),
    };

    // erxes-ui / ui-modules arrive from npm as TypeScript source — the default
    // rules exclude node_modules, so transpile them explicitly.
    config.module?.rules?.push({
      test: /\.[jt]sx?$/,
      include: /node_modules[\\/].*(erxes-ui|ui-modules|@erxes)/,
      use: {
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            transform: { react: { runtime: 'automatic' } },
          },
        },
      },
      type: 'javascript/auto',
      // @erxes/ui is "type": "module"; its imports omit file extensions.
      resolve: { fullySpecified: false },
    });
    return config;
  },
);
