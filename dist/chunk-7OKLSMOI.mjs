import {
  DIRECTIVE_IMPORT_PREFIX,
  DISABLE_COMMENT,
  getNameFromFilePath,
  getTransformedPath,
  matchGlobs,
  normalizeComponetInfo,
  parseId,
  pascalCase,
  resolveAlias,
  shouldTransform,
  stringifyComponentImport
} from "./chunk-667B3WUW.mjs";
import {
  __require,
  __spreadProps,
  __spreadValues
} from "./chunk-ZKNUHGJ4.mjs";

// src/core/unplugin.ts
import { existsSync as existsSync2 } from "fs";
import { createUnplugin } from "unplugin";
import { createFilter } from "@rollup/pluginutils";
import chokidar from "chokidar";

// src/core/context.ts
import { relative as relative2 } from "path";
import Debug5 from "debug";
import { slash as slash3, throttle, toArray as toArray2 } from "@antfu/utils";

// src/core/options.ts
import { join, resolve } from "path";
import { slash, toArray } from "@antfu/utils";
import { isPackageExists as isPackageExists2 } from "local-pkg";

// src/core/type-imports/detect.ts
import { isPackageExists } from "local-pkg";
import { notNullish } from "@antfu/utils";

// src/core/type-imports/index.ts
var TypeImportPresets = [
  {
    from: "vue-router",
    names: [
      "RouterView",
      "RouterLink"
    ]
  },
  {
    from: "vue-starport",
    names: [
      "Starport",
      "StarportCarrier"
    ]
  }
];

// src/core/type-imports/detect.ts
function detectTypeImports() {
  return TypeImportPresets.map((i) => isPackageExists(i.from) ? i : void 0).filter(notNullish);
}
function resolveTypeImports(imports) {
  return imports.flatMap((i) => i.names.map((n) => ({ from: i.from, name: n, as: n })));
}

// src/core/options.ts
var defaultOptions = {
  dirs: "src/components",
  extensions: "vue",
  deep: true,
  dts: isPackageExists2("typescript"),
  dtsTransform: (v) => v,
  directoryAsNamespace: false,
  collapseSamePrefixes: false,
  globalNamespaces: [],
  resolvers: [],
  importPathTransform: (v) => v,
  allowOverrides: false
};
function normalizeResolvers(resolvers) {
  return toArray(resolvers).flat().map((r) => typeof r === "function" ? { resolve: r, type: "component" } : r);
}
function resolveOptions(options, root) {
  const resolved = Object.assign({}, defaultOptions, options);
  resolved.resolvers = normalizeResolvers(resolved.resolvers);
  resolved.extensions = toArray(resolved.extensions);
  if (resolved.globs) {
    resolved.globs = toArray(resolved.globs).map((glob) => slash(resolve(root, glob)));
    resolved.resolvedDirs = [];
  } else {
    const extsGlob = resolved.extensions.length === 1 ? resolved.extensions : `{${resolved.extensions.join(",")}}`;
    resolved.dirs = toArray(resolved.dirs);
    resolved.resolvedDirs = resolved.dirs.map((i) => slash(resolve(root, i)));
    resolved.globs = resolved.resolvedDirs.map((i) => resolved.deep ? slash(join(i, `**/*.${extsGlob}`)) : slash(join(i, `*.${extsGlob}`)));
    if (!resolved.extensions.length)
      throw new Error("[unplugin-vue-components] `extensions` option is required to search for components");
  }
  resolved.dts = !resolved.dts ? false : resolve(root, typeof resolved.dts === "string" ? resolved.dts : "components.d.ts");
  if (typeof resolved.dtsTransform !== "function")
    resolved.dtsTransform = (declarations) => declarations;
  if (!resolved.types && resolved.dts)
    resolved.types = detectTypeImports();
  resolved.types = resolved.types || [];
  resolved.root = root;
  resolved.transformer = options.transformer || getVueVersion() || "vue3";
  resolved.directives = typeof options.directives === "boolean" ? options.directives : !resolved.resolvers.some((i) => i.type === "directive") ? false : getVueVersion() === "vue3";
  return resolved;
}
function getVueVersion() {
  var _a;
  try {
    const vue = __require("vue");
    const version = ((_a = vue == null ? void 0 : vue.default) == null ? void 0 : _a.version) || (vue == null ? void 0 : vue.version) || "3";
    return version.startsWith("2.") ? "vue2" : "vue3";
  } catch {
    return null;
  }
}

// src/core/fs/glob.ts
import fg from "fast-glob";
import Debug from "debug";
var debug = Debug("unplugin-vue-components:glob");
function searchComponents(ctx) {
  var _a;
  debug(`started with: [${ctx.options.globs.join(", ")}]`);
  const root = ctx.root;
  const files = fg.sync(ctx.options.globs, {
    ignore: ["node_modules"],
    onlyFiles: true,
    cwd: root,
    absolute: true
  });
  if (!files.length && !((_a = ctx.options.resolvers) == null ? void 0 : _a.length))
    console.warn("[unplugin-vue-components] no components found");
  debug(`${files.length} components found.`);
  ctx.addComponents(files);
}

// src/core/declaration.ts
import { dirname, isAbsolute, relative } from "path";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { notNullish as notNullish2, slash as slash2 } from "@antfu/utils";
var multilineCommentsRE = /\/\*.*?\*\//gms;
var singlelineCommentsRE = /\/\/.*$/gm;
function extractImports(code) {
  return Object.fromEntries(Array.from(code.matchAll(/['"]?([^\s'"]+)['"]?\s*:\s*(.+?)[,;\n]/g)).map((i) => [i[1], i[2]]));
}
function parseDeclaration(code) {
  var _a, _b;
  if (!code)
    return;
  code = code.replace(multilineCommentsRE, "").replace(singlelineCommentsRE, "");
  const imports = {
    component: {},
    directive: {}
  };
  const componentDeclaration = (_a = /export\s+interface\s+GlobalComponents\s*{(.*?)}/s.exec(code)) == null ? void 0 : _a[0];
  if (componentDeclaration)
    imports.component = extractImports(componentDeclaration);
  const directiveDeclaration = (_b = /export\s+interface\s+ComponentCustomProperties\s*{(.*?)}/s.exec(code)) == null ? void 0 : _b[0];
  if (directiveDeclaration)
    imports.directive = extractImports(directiveDeclaration);
  return imports;
}
function stringifyComponentInfo(filepath, { from: path, as: name, name: importName }, importPathTransform) {
  if (!name)
    return void 0;
  path = getTransformedPath(path, importPathTransform);
  const related = isAbsolute(path) ? `./${relative(dirname(filepath), path)}` : path;
  const entry = `typeof import('${slash2(related)}')['${importName || "default"}']`;
  return [name, entry];
}
function stringifyComponentsInfo(filepath, components, importPathTransform) {
  return Object.fromEntries(components.map((info) => stringifyComponentInfo(filepath, info, importPathTransform)).filter(notNullish2));
}
function getDeclarationImports(ctx, filepath) {
  const component = stringifyComponentsInfo(filepath, [
    ...Object.values(__spreadValues(__spreadValues({}, ctx.componentNameMap), ctx.componentCustomMap)),
    ...resolveTypeImports(ctx.options.types)
  ], ctx.options.importPathTransform);
  const directive = stringifyComponentsInfo(filepath, Object.values(ctx.directiveCustomMap), ctx.options.importPathTransform);
  if (Object.keys(component).length + Object.keys(directive).length === 0)
    return;
  return { component, directive };
}
function stringifyDeclarationImports(imports) {
  return Object.entries(imports).sort(([a], [b]) => a.localeCompare(b)).map(([name, v]) => {
    if (!/^\w+$/.test(name))
      name = `'${name}'`;
    return `${name}: ${v}`;
  });
}
function getDeclaration(ctx, filepath, transformer2, originalImports) {
  const imports = getDeclarationImports(ctx, filepath);
  if (!imports)
    return;
  let declarations = {
    component: stringifyDeclarationImports(__spreadValues(__spreadValues({}, originalImports == null ? void 0 : originalImports.component), imports.component)),
    directive: stringifyDeclarationImports(__spreadValues(__spreadValues({}, originalImports == null ? void 0 : originalImports.directive), imports.directive))
  };
  if (typeof transformer2 === "function")
    declarations = transformer2(declarations);
  let code = `// generated by unplugin-vue-components
// We suggest you to commit this file into source control
// Read more: https://github.com/vuejs/core/pull/3399
import '@vue/runtime-core'

export {}

declare module '@vue/runtime-core' {`;
  if (Object.keys(declarations.component).length > 0) {
    code += `
  export interface GlobalComponents {
    ${declarations.component.join("\n    ")}
  }`;
  }
  if (Object.keys(declarations.directive).length > 0) {
    code += `
  export interface ComponentCustomProperties {
    ${declarations.directive.join("\n    ")}
  }`;
  }
  code += "\n}\n";
  return code;
}
async function writeDeclaration(ctx, filepath, transformer2, removeUnused = false) {
  const originalContent = existsSync(filepath) ? await readFile(filepath, "utf-8") : "";
  const originalImports = removeUnused ? void 0 : parseDeclaration(originalContent);
  const code = getDeclaration(ctx, filepath, transformer2, originalImports);
  if (!code)
    return;
  if (code !== originalContent)
    await writeFile(filepath, code, "utf-8");
}

// src/core/transformer.ts
import Debug4 from "debug";
import MagicString from "magic-string";

// src/core/transforms/component.ts
import Debug2 from "debug";
var debug2 = Debug2("unplugin-vue-components:transform:component");
var resolveVue2 = (code, s) => {
  const results = [];
  for (const match of code.matchAll(/_c\([\s\n\t]*['"](.+?)["']([,)])/g)) {
    const [full, matchedName, append] = match;
    if (match.index != null && matchedName && !matchedName.startsWith("_")) {
      const start = match.index;
      const end = start + full.length;
      results.push({
        rawName: matchedName,
        replace: (resolved) => s.overwrite(start, end, `_c(${resolved}${append}`)
      });
    }
  }
  return results;
};
var resolveVue3 = (code, s) => {
  const results = [];
  for (const match of code.matchAll(/_resolveComponent\("(.+?)"\)/g)) {
    const matchedName = match[1];
    if (match.index != null && matchedName && !matchedName.startsWith("_")) {
      const start = match.index;
      const end = start + match[0].length;
      results.push({
        rawName: matchedName,
        replace: (resolved) => s.overwrite(start, end, resolved)
      });
    }
  }
  return results;
};
async function transformComponent(code, transformer2, s, ctx, sfcPath) {
  let no = 0;
  const results = transformer2 === "vue2" ? resolveVue2(code, s) : resolveVue3(code, s);
  for (const { rawName, replace } of results) {
    debug2(`| ${rawName}`);
    const name = pascalCase(rawName);
    ctx.updateUsageMap(sfcPath, [name]);
    const component = await ctx.findComponent(name, "component", [sfcPath]);
    if (component) {
      const varName = `__unplugin_components_${no}`;
      s.prepend(`${stringifyComponentImport(__spreadProps(__spreadValues({}, component), { as: varName }), ctx)};
`);
      no += 1;
      replace(varName);
    }
  }
  debug2(`^ (${no})`);
}

// src/core/transforms/directive/index.ts
import Debug3 from "debug";

// src/core/transforms/directive/vue2.ts
import { importModule, isPackageExists as isPackageExists3 } from "local-pkg";
var getRenderFnStart = (ast) => {
  var _a, _b;
  const renderFn = ast.program.body.find((node) => node.type === "VariableDeclaration" && node.declarations[0].id.type === "Identifier" && node.declarations[0].id.name === "render");
  const start = (_b = (_a = renderFn == null ? void 0 : renderFn.declarations[0].init) == null ? void 0 : _a.body) == null ? void 0 : _b.start;
  if (start === null || start === void 0)
    throw new Error("[unplugin-vue-components:directive] Cannot find render function position.");
  return start + 1;
};
async function resolveVue22(code, s) {
  var _a, _b, _c;
  if (!isPackageExists3("@babel/parser"))
    throw new Error('[unplugin-vue-components:directive] To use Vue 2 directive you will need to install Babel first: "npm install -D @babel/parser"');
  const { parse } = await importModule("@babel/parser");
  const ast = parse(code, {
    sourceType: "module"
  });
  const nodes = [];
  const { walk } = await import("./src-WRIQ2NEL.mjs");
  walk(ast.program, {
    enter(node) {
      if (node.type === "CallExpression")
        nodes.push(node);
    }
  });
  const results = [];
  for (const node of nodes) {
    const { callee, arguments: args } = node;
    if (callee.type !== "Identifier" || callee.name !== "_c" || ((_a = args[1]) == null ? void 0 : _a.type) !== "ObjectExpression")
      continue;
    const directives = (_b = args[1].properties.find((property) => property.type === "ObjectProperty" && property.key.type === "Identifier" && property.key.name === "directives")) == null ? void 0 : _b.value;
    if (!directives || directives.type !== "ArrayExpression")
      continue;
    const renderStart = getRenderFnStart(ast);
    for (const directive of directives.elements) {
      if ((directive == null ? void 0 : directive.type) !== "ObjectExpression")
        continue;
      const nameNode = (_c = directive.properties.find((p) => p.type === "ObjectProperty" && p.key.type === "Identifier" && p.key.name === "name")) == null ? void 0 : _c.value;
      if ((nameNode == null ? void 0 : nameNode.type) !== "StringLiteral")
        continue;
      const name = nameNode.value;
      if (!name || name.startsWith("_"))
        continue;
      results.push({
        rawName: name,
        replace: (resolved) => {
          s.prependLeft(renderStart, `
this.$options.directives["${name}"] = ${resolved};`);
        }
      });
    }
  }
  return results;
}

// src/core/transforms/directive/vue3.ts
function resolveVue32(code, s) {
  const results = [];
  for (const match of code.matchAll(/_resolveDirective\("(.+?)"\)/g)) {
    const matchedName = match[1];
    if (match.index != null && matchedName && !matchedName.startsWith("_")) {
      const start = match.index;
      const end = start + match[0].length;
      results.push({
        rawName: matchedName,
        replace: (resolved) => s.overwrite(start, end, resolved)
      });
    }
  }
  return results;
}

// src/core/transforms/directive/index.ts
var debug3 = Debug3("unplugin-vue-components:transform:directive");
async function transformDirective(code, transformer2, s, ctx, sfcPath) {
  let no = 0;
  const results = await (transformer2 === "vue2" ? resolveVue22(code, s) : resolveVue32(code, s));
  for (const { rawName, replace } of results) {
    debug3(`| ${rawName}`);
    const name = `${DIRECTIVE_IMPORT_PREFIX}${pascalCase(rawName)}`;
    ctx.updateUsageMap(sfcPath, [name]);
    const directive = await ctx.findComponent(name, "directive", [sfcPath]);
    if (!directive)
      continue;
    const varName = `__unplugin_directives_${no}`;
    s.prepend(`${stringifyComponentImport(__spreadProps(__spreadValues({}, directive), { as: varName }), ctx)};
`);
    no += 1;
    replace(varName);
  }
  debug3(`^ (${no})`);
}

// src/core/transformer.ts
var debug4 = Debug4("unplugin-vue-components:transformer");
function transformer(ctx, transformer2) {
  return async (code, id, path) => {
    ctx.searchGlob();
    const sfcPath = ctx.normalizePath(path);
    debug4(sfcPath);
    const s = new MagicString(code);
    await transformComponent(code, transformer2, s, ctx, sfcPath);
    if (ctx.options.directives)
      await transformDirective(code, transformer2, s, ctx, sfcPath);
    s.prepend(DISABLE_COMMENT);
    const result = { code: s.toString() };
    if (ctx.sourcemap)
      result.map = s.generateMap({ source: id, includeContent: true });
    return result;
  };
}

// src/core/context.ts
var debug5 = {
  components: Debug5("unplugin-vue-components:context:components"),
  search: Debug5("unplugin-vue-components:context:search"),
  hmr: Debug5("unplugin-vue-components:context:hmr"),
  decleration: Debug5("unplugin-vue-components:decleration"),
  env: Debug5("unplugin-vue-components:env")
};
var Context = class {
  constructor(rawOptions) {
    this.rawOptions = rawOptions;
    this.transformer = void 0;
    this._componentPaths = /* @__PURE__ */ new Set();
    this._componentNameMap = {};
    this._componentUsageMap = {};
    this._componentCustomMap = {};
    this._directiveCustomMap = {};
    this.root = process.cwd();
    this.sourcemap = true;
    this.alias = {};
    this._searched = false;
    this.options = resolveOptions(rawOptions, this.root);
    this.generateDeclaration = throttle(500, false, this._generateDeclaration.bind(this));
    this.setTransformer(this.options.transformer);
  }
  setRoot(root) {
    if (this.root === root)
      return;
    debug5.env("root", root);
    this.root = root;
    this.options = resolveOptions(this.rawOptions, this.root);
  }
  setTransformer(name) {
    debug5.env("transformer", name);
    this.transformer = transformer(this, name || "vue3");
  }
  transform(code, id) {
    const { path, query } = parseId(id);
    return this.transformer(code, id, path, query);
  }
  setupViteServer(server) {
    if (this._server === server)
      return;
    this._server = server;
    this.setupWatcher(server.watcher);
  }
  setupWatcher(watcher) {
    const { globs } = this.options;
    watcher.on("unlink", (path) => {
      if (!matchGlobs(path, globs))
        return;
      path = slash3(path);
      this.removeComponents(path);
      this.onUpdate(path);
    });
    watcher.on("add", (path) => {
      if (!matchGlobs(path, globs))
        return;
      path = slash3(path);
      this.addComponents(path);
      this.onUpdate(path);
    });
  }
  setupWatcherWebpack(watcher, emitUpdate) {
    const { globs } = this.options;
    watcher.on("unlink", (path) => {
      if (!matchGlobs(path, globs))
        return;
      path = slash3(path);
      this.removeComponents(path);
      emitUpdate(path, "unlink");
    });
    watcher.on("add", (path) => {
      if (!matchGlobs(path, globs))
        return;
      path = slash3(path);
      this.addComponents(path);
      emitUpdate(path, "add");
    });
  }
  updateUsageMap(path, paths) {
    if (!this._componentUsageMap[path])
      this._componentUsageMap[path] = /* @__PURE__ */ new Set();
    paths.forEach((p) => {
      this._componentUsageMap[path].add(p);
    });
  }
  addComponents(paths) {
    debug5.components("add", paths);
    const size = this._componentPaths.size;
    toArray2(paths).forEach((p) => this._componentPaths.add(p));
    if (this._componentPaths.size !== size) {
      this.updateComponentNameMap();
      return true;
    }
    return false;
  }
  addCustomComponents(info) {
    if (info.as)
      this._componentCustomMap[info.as] = info;
  }
  addCustomDirectives(info) {
    if (info.as)
      this._directiveCustomMap[info.as] = info;
  }
  removeComponents(paths) {
    debug5.components("remove", paths);
    const size = this._componentPaths.size;
    toArray2(paths).forEach((p) => this._componentPaths.delete(p));
    if (this._componentPaths.size !== size) {
      this.updateComponentNameMap();
      return true;
    }
    return false;
  }
  onUpdate(path) {
    this.generateDeclaration();
    if (!this._server)
      return;
    const payload = {
      type: "update",
      updates: []
    };
    const timestamp = +new Date();
    const name = pascalCase(getNameFromFilePath(path, this.options));
    Object.entries(this._componentUsageMap).forEach(([key, values]) => {
      if (values.has(name)) {
        const r = `/${slash3(relative2(this.root, key))}`;
        payload.updates.push({
          acceptedPath: r,
          path: r,
          timestamp,
          type: "js-update"
        });
      }
    });
    if (payload.updates.length)
      this._server.ws.send(payload);
  }
  updateComponentNameMap() {
    this._componentNameMap = {};
    Array.from(this._componentPaths).forEach((path) => {
      const name = pascalCase(getNameFromFilePath(path, this.options));
      if (this._componentNameMap[name] && !this.options.allowOverrides) {
        console.warn(`[unplugin-vue-components] component "${name}"(${path}) has naming conflicts with other components, ignored.`);
        return;
      }
      this._componentNameMap[name] = {
        as: name,
        from: path
      };
    });
  }
  async findComponent(name, type, excludePaths = []) {
    let info = this._componentNameMap[name];
    if (info && !excludePaths.includes(info.from) && !excludePaths.includes(info.from.slice(1)))
      return info;
    for (const resolver of this.options.resolvers) {
      if (resolver.type !== type)
        continue;
      const result = await resolver.resolve(type === "directive" ? name.slice(DIRECTIVE_IMPORT_PREFIX.length) : name);
      if (!result)
        continue;
      if (typeof result === "string") {
        info = {
          as: name,
          from: result
        };
      } else {
        info = __spreadValues({
          as: name
        }, normalizeComponetInfo(result));
      }
      if (type === "component")
        this.addCustomComponents(info);
      else if (type === "directive")
        this.addCustomDirectives(info);
      return info;
    }
    return void 0;
  }
  normalizePath(path) {
    var _a, _b, _c;
    return resolveAlias(path, ((_b = (_a = this.viteConfig) == null ? void 0 : _a.resolve) == null ? void 0 : _b.alias) || ((_c = this.viteConfig) == null ? void 0 : _c.alias) || []);
  }
  relative(path) {
    if (path.startsWith("/") && !path.startsWith(this.root))
      return slash3(path.slice(1));
    return slash3(relative2(this.root, path));
  }
  searchGlob() {
    if (this._searched)
      return;
    searchComponents(this);
    debug5.search(this._componentNameMap);
    this._searched = true;
  }
  _generateDeclaration(removeUnused = !this._server) {
    if (!this.options.dts)
      return;
    debug5.decleration("generating");
    return writeDeclaration(this, this.options.dts, this.options.dtsTransform, removeUnused);
  }
  get componentNameMap() {
    return this._componentNameMap;
  }
  get componentCustomMap() {
    return this._componentCustomMap;
  }
  get directiveCustomMap() {
    return this._directiveCustomMap;
  }
};

// src/core/unplugin.ts
var PLUGIN_NAME = "unplugin:webpack";
var unplugin_default = createUnplugin((options = {}) => {
  const filter = createFilter(options.include || [/\.vue$/, /\.vue\?vue/], options.exclude || [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/, /[\\/]\.nuxt[\\/]/]);
  const ctx = new Context(options);
  const api = {
    async findComponent(name, filename) {
      return await ctx.findComponent(name, "component", filename ? [filename] : []);
    },
    stringifyImport(info) {
      return stringifyComponentImport(info, ctx);
    }
  };
  return {
    name: "unplugin-vue-components",
    enforce: "post",
    api,
    transformInclude(id) {
      return filter(id);
    },
    async transform(code, id) {
      if (!shouldTransform(code))
        return null;
      try {
        const result = await ctx.transform(code, id);
        ctx.generateDeclaration();
        return result;
      } catch (e) {
        this.error(e);
      }
    },
    vite: {
      configResolved(config) {
        ctx.setRoot(config.root);
        ctx.sourcemap = true;
        if (config.plugins.find((i) => i.name === "vite-plugin-vue2"))
          ctx.setTransformer("vue2");
        if (ctx.options.dts) {
          ctx.searchGlob();
          if (!existsSync2(ctx.options.dts))
            ctx.generateDeclaration();
        }
        if (config.build.watch && config.command === "build")
          ctx.setupWatcher(chokidar.watch(ctx.options.globs));
      },
      configureServer(server) {
        ctx.setupViteServer(server);
      }
    },
    webpack(compiler) {
      let watcher;
      let fileDepQueue = [];
      compiler.hooks.watchRun.tap(PLUGIN_NAME, () => {
        if (!watcher && compiler.watching) {
          watcher = compiler.watching;
          ctx.setupWatcherWebpack(chokidar.watch(ctx.options.globs), (path, type) => {
            fileDepQueue.push({ path, type });
            process.nextTick(() => {
              watcher.invalidate();
            });
          });
        }
      });
      compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
        if (fileDepQueue.length) {
          fileDepQueue.forEach(({ path, type }) => {
            if (type === "unlink")
              compilation.fileDependencies.delete(path);
            else
              compilation.fileDependencies.add(path);
          });
          fileDepQueue = [];
        }
      });
    }
  };
});

export {
  unplugin_default
};
