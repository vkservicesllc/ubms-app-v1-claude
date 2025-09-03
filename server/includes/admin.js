const defaults = {
    external: [ 'jquery', 'jquery.cookie', 'jquery.caret', 'font-awesome', 'bulma' ],
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
        css: [ ...defaults.internal.css, 'nav' ],
        js: [ ...defaults.internal.js, 'no-mobile', '^idle-timeout-plus' ],
        mjs: [ ...defaults.internal.mjs, 'theme.online' ],
    },
}


module.exports = {

    'login': {
        external: [ ...offline.external ],
        internal: {
            css: [ ...offline.internal.css, 'login' ],
            js: [ ...offline.internal.js ],
            mjs: [ ...offline.internal.mjs, 'theme.login', '^login' ],
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

    'charts': {
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
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'companies': {
        external: [ ...online.external, 'datatables.bulma', 'datatables.bulma.row-group', 'moment' ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs, '^companies' ],
        },
    },

    'company': {
        external: [ ...online.external, 'bulma.steps', 'bulma.checkradio', 'jquery.masked-input', 'moment', 'cropper' ],
        internal: {
            css: [ ...online.internal.css, 'form' ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'owners': {
        external: [ ...online.external, 'jquery.masked-input', 'bulma.checkradio', 'datatables.bulma', 'moment' ],
        internal: {
            css: [ ...online.internal.css, 'form' ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs, '^owners' ],
        },
    },

    'branches': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css, 'tabs' ],
            js: [ ...online.internal.js, '^tabs' ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'domains': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'users': {
        external: [ ...online.external, 'jquery.masked-input', 'moment', 'datatables.bulma', 'bulma.switch' ],
        internal: {
            css: [ ...online.internal.css, 'form', 'tabs' ],
            js: [ ...online.internal.js, '^tabs' ],
            mjs: [ ...online.internal.mjs, '^users' ],
        },
    },

    'user': {
        external: [ ...online.external, 'bulma.switch' ],
        internal: {
            css: [ ...online.internal.css, 'theme' ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs, '^user' ],
        },
    },

    'teams': {
        external: [ ...online.external, 'jquery.masked-input' ],
        internal: {
            css: [ ...online.internal.css, 'form' ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs, '^teams' ],
        },
    },

    'devData': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

    'devLogs': {
        external: [ ...online.external ],
        internal: {
            css: [ ...online.internal.css ],
            js: [ ...online.internal.js ],
            mjs: [ ...online.internal.mjs ],
        },
    },

}