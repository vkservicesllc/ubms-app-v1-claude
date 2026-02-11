const defaults = {
    external: [ 'jquery', 'jquery.cookie', 'jquery.caret', 'bootstrap' ],
    internal: {
        css: [],
        js: [],
        mjs: [],
    },
}

module.exports = {

    'application.start': {
        external: [ ...defaults.external, 'imask', 'font-awesome', 'moment' ],
        internal: {
            css: [ ...defaults.internal.css, 'bootstrap.form', 'application' ],
            js: [ ...defaults.internal.js, '^application' ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

    'application.login': {
        external: [ ...defaults.external, 'imask', 'font-awesome' ],
        internal: {
            css: [ ...defaults.internal.css, 'application' ],
            js: [ ...defaults.internal.js, '^application' ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

    'application': {
        external: [ ...defaults.external,
            'jquery.masked-input', //! TEMP
            'imask', 'font-awesome', 'moment' ],
        internal: {
            css: [ ...defaults.internal.css, 'bootstrap.form', 'application' ],
            js: [ ...defaults.internal.js, '^application', 'session.keep-alive', '^application/scroller' ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

    'application.summary': {
        external: [ ...defaults.external, 'moment' ],
        internal: {
            css: [ ...defaults.internal.css, 'application' ],
            js: [ ...defaults.internal.js, '^application', 'session.keep-alive' ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

    'application.documents': {
        external: [ ...defaults.external ],
        internal: {
            css: [ ...defaults.internal.css, 'application' ],
            js: [ ...defaults.internal.js, '^application', 'session.keep-alive' ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

    'application.agreement': {
        external: [ ...defaults.external ],
        internal: {
            css: [ ...defaults.internal.css, 'application' ],
            js: [ ...defaults.internal.js, '^application', 'session.keep-alive' ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

    'application.submitted': {
        external: [ ...defaults.external ],
        internal: {
            css: [ ...defaults.internal.css, 'application' ],
            js: [ ...defaults.internal.js, '^application' ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

}