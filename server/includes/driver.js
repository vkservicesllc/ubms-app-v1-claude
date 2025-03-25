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
        external: [ ...defaults.external, 'jquery.masked-input', 'font-awesome', 'moment' ],
        internal: {
            css: [ ...defaults.internal.css, 'application' ],
            js: [ ...defaults.internal.js ],
            mjs: [ ...defaults.internal.mjs ],
        },
    },

}