const defaults = {
    external: [ 'jquery', 'jquery.cookie', 'jquery.caret', 'bootstrap' ],
    internal: {
        css: [],
        js: [],
        mjs: [],
    },
}

module.exports = {

    'application': {
        external: [ ...defaults.external, 'jquery.masked-input', 'moment' ],
        internal: {
            css: [ ...defaults.internal.css ],
            js: [ ...defaults.internal.js ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

}