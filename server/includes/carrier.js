const defaults = {
    external: [ 'jquery', 'jquery.cookie', 'jquery.caret', 'materialize' ],
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
        js: [ ...defaults.internal.js, '^idle-timeout-plus' ],
        mjs: [ ...defaults.internal.mjs, 'no-mobile' ],
    },
}


module.exports = {

    'login': {
        external: [ ...offline.external ],
        internal: {
            css: [ ...offline.internal.css ],
            js: [ ...offline.internal.js ],
            mjs: [ ...offline.internal.mjs ],
        },
    },

}