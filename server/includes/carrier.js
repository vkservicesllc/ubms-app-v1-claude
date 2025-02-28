const defaults = {
    external: [ 'jquery', 'jquery.cookie', 'jquery.caret', 'fomantic-ui' ],
    internal: {
        css: [],
        js: [],
        mjs: [],
    },
}


const offline = {
    external: [ ...defaults.external ],
    internal: {
        css: [ ...defaults.internal.css ],
        js: [ ...defaults.internal.js ],
        mjs: [ ...defaults.internal.mjs ],
    },
}


const online = {
    external: [ ...defaults.external, 'store', 'jquery.ui', 'jquery.idle-timeout-plus' ],
    internal: {
        css: [ ...defaults.internal.css ],
        js: [ ...defaults.internal.js, '^idle-timeout-plus' ],
        mjs: [ ...defaults.internal.mjs, 'no-mobile' ],
    },
}


module.exports = {

    'login': {
        external: [ ...offline.external ],
        internal: {
            css: [ ...offline.internal.css, 'login' ],
            js: [ ...offline.internal.js ],
            mjs: [ ...offline.internal.mjs, '^login' ],
        },
    },

    'home': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'dash': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

}