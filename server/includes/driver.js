const defaults = {
    external: [ 'jquery', 'jquery.cookie', 'jquery.caret', 'bootstrap' ],
    internal: {
        css: [],
        js: [],
        mjs: [],
    },
}

module.exports = {

    'application.registration': {
        external: [ ...defaults.external, 'jquery.masked-input', 'font-awesome', 'moment' ],
        internal: {
            css: [ ...defaults.internal.css, 'bootstrap.form', 'application' ],
            js: [ ...defaults.internal.js ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

    'application.login': {
        external: [ ...defaults.external, 'jquery.masked-input' ],
        internal: {
            css: [ ...defaults.internal.css, 'application' ],
            js: [ ...defaults.internal.js ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

    'application': {
        external: [ ...defaults.external, 'jquery.masked-input', 'font-awesome', 'moment' ],
        internal: {
            css: [ ...defaults.internal.css, 'bootstrap.form', 'application' ],
            js: [ ...defaults.internal.js, 'session.keep-alive' ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

    'application.summary': {
        external: [ ...defaults.external, 'moment' ],
        internal: {
            css: [ ...defaults.internal.css, 'application' ],
            js: [ ...defaults.internal.js, 'session.keep-alive' ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

    'application.documents': {
        external: [ ...defaults.external ],
        internal: {
            css: [ ...defaults.internal.css, 'application' ],
            js: [ ...defaults.internal.js, 'session.keep-alive' ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

    'application.agreement': {
        external: [ ...defaults.external ],
        internal: {
            css: [ ...defaults.internal.css, 'application' ],
            js: [ ...defaults.internal.js, 'session.keep-alive' ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

    'application.submitted': {
        external: [ ...defaults.external ],
        internal: {
            css: [ ...defaults.internal.css, 'application' ],
            js: [ ...defaults.internal.js ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

}