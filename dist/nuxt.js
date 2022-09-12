"use strict";Object.defineProperty(exports, "__esModule", {value: true});

var _chunkIMGWIQDUjs = require('./chunk-IMGWIQDU.js');
require('./chunk-2GXY7E6X.js');
require('./chunk-BTQOTIPQ.js');
require('./chunk-6F4PWJZI.js');

// src/nuxt.ts
function nuxt_default(options) {
  this.extendBuild((config) => {
    config.plugins = config.plugins || [];
    config.plugins.unshift(_chunkIMGWIQDUjs.unplugin_default.webpack(options));
  });
  this.nuxt.hook("vite:extend", async (vite) => {
    vite.config.plugins = vite.config.plugins || [];
    vite.config.plugins.push(_chunkIMGWIQDUjs.unplugin_default.vite(options));
  });
}


module.exports = nuxt_default;
exports.default = module.exports;