import {
  unplugin_default
} from "./chunk-7OKLSMOI.mjs";
import "./chunk-667B3WUW.mjs";
import "./chunk-ZKNUHGJ4.mjs";
import "./chunk-WBQAMGXK.mjs";

// src/nuxt.ts
function nuxt_default(options) {
  this.extendBuild((config) => {
    config.plugins = config.plugins || [];
    config.plugins.unshift(unplugin_default.webpack(options));
  });
  this.nuxt.hook("vite:extend", async (vite) => {
    vite.config.plugins = vite.config.plugins || [];
    vite.config.plugins.push(unplugin_default.vite(options));
  });
}
export {
  nuxt_default as default
};
