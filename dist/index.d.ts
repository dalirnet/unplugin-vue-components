import { Options } from './types.js';
export { ComponentInfo, ComponentResolveResult, ComponentResolver, ComponentResolverFunction, ComponentResolverObject, ComponentsImportMap, DeclarationOutput, DeclarationTransformer, ImportInfo, ImportInfoLegacy, Matcher, Options, PublicPluginAPI, ResolvedOptions, SideEffectsInfo, SupportedTransformer, Transformer, TypeImport } from './types.js';
import * as unplugin from 'unplugin';
import '@rollup/pluginutils';
import '@antfu/utils';

declare const _default: unplugin.UnpluginInstance<Options>;

declare function pascalCase(str: string): string;
declare function camelCase(str: string): string;
declare function kebabCase(key: string): string;

export { camelCase, _default as default, kebabCase, pascalCase };
