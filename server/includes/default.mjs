const defaults = {
  external: ['jquery', 'jquery.cookie', 'jquery.caret', 'font-awesome', 'materialize'],
  internal: {
    css: [],
    js: [],
    mjs: [],
  },
};

const offline = {
  external: [...defaults.external],
  internal: {
    css: [...defaults.internal.css],
    js: [...defaults.internal.js],
    mjs: [...defaults.internal.mjs],
  },
};

const online = {
  external: [...defaults.external],
  internal: {
    css: [...defaults.internal.css],
    js: [...defaults.internal.js],
    mjs: [...defaults.internal.mjs],
  },
};

module.exports = {
  login: {
    external: [...offline.external],
    internal: {
      css: [...offline.internal.css],
      js: [...offline.internal.js],
      mjs: [...offline.internal.mjs],
    },
  },

  welcome: {
    external: [...offline.external],
    internal: {
      css: [...offline.internal.css],
      js: [...offline.internal.js],
      mjs: [...offline.internal.mjs],
    },
  },
};
