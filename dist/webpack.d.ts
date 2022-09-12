import * as webpack from 'webpack';
import { Options } from './types.js';
import '@rollup/pluginutils';
import 'unplugin';
import '@antfu/utils';

declare const _default: (options?: Options | undefined) => webpack.WebpackPluginInstance;

export { _default as default };
