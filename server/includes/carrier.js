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
        css: [ ...defaults.internal.css, 'fomantic-ui.form', 'nav' ],
        js: [ ...defaults.internal.js, 'no-mobile', '^idle-timeout-plus' ],
        mjs: [ ...defaults.internal.mjs ],
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

    'team': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'settings': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js, '^app/settings' ],
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

    'vehicles': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'drivers': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'drivers.pre-applications': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'drivers.applications': {
        external: [ ...online.external, 'jquery.masked-input', 'datatables.fomantic-ui', 'moment' ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'drivers.application.e-form': {
        external: [ ...online.external, 'jquery.masked-input', 'moment' ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'drivers.pre-employments': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'drivers.hired': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'drivers.pay-agreements': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'drivers.leaving': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'drivers.former': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

}